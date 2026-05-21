import postgresPool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { findBestAgentForCategory } from "./assignmentService.js";
import { 
  sendTicketConfirmationEmail, 
  sendTicketStatusUpdateEmail, 
  sendImmediateAgentAssignmentEmails, 
  sendTicketUpdateEmail,
  sendTicketCreatedHelpdeskEmail,
  sendTicketRcaEmail
} from "../utils/emailService.js";
import { ticketAutomationQueue } from "../config/queue.js";
import ticketEventEmitter from "../utils/eventEmitter.js";

const ACTIVE_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "ESCALATED"];

const getCustomerContactByTicketId = async (client, ticketId) => {
  const result = await client.query(
    `SELECT u.name, u.email, t.ticket_no, c.customer_id, ic.name as category, te.message, t.circuit_description
     FROM tickets t
     JOIN customers c ON c.id = t.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
     LEFT JOIN ticket_events te ON te.ticket_id = t.id AND te.event_type = 'TICKET_CREATED'
     WHERE t.id = $1`,
    [ticketId]
  );
  return result.rows[0];
};

const getEmployeeDetailsById = async (client, employeeId) => {
  const result = await client.query(
    `SELECT e.id, u.name, u.email
     FROM employees e
     JOIN users u ON u.id = e.user_id
     WHERE e.id = $1
     LIMIT 1`,
    [employeeId]
  );
  return result.rows[0] || null;
};

const runInTransaction = async (work) => {
  const client = await postgresPool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
};


const getCustomerProfileByUserId = async (client, userId) => {
  const result = await client.query(
    `SELECT id, customer_id
     FROM customers
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] || null;
};

const getEmployeeProfileByUserId = async (client, userId) => {
  const result = await client.query(
    `SELECT e.id, e.employee_id, u.role, u.name
     FROM employees e
     JOIN users u ON u.id = e.user_id
     WHERE e.user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] || null;
};


const insertTicketEvents = async (client, events) => {
  if (!events || events.length === 0) return [];

  const values = [];
  const placeholders = [];
  let idx = 1;

  for (const e of events) {
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    values.push(
      e.ticketId,
      e.actorUserId || null,
      e.eventType,
      e.message || null,
      e.metadata || {},
      e.visibleToCustomer ?? true
    );
  }

  const query = `
    INSERT INTO ticket_events (
      ticket_id,
      actor_user_id,
      event_type,
      message,
      metadata,
      visible_to_customer
    )
    VALUES ${placeholders.join(", ")}
    RETURNING id, ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer, created_at
  `;

  const result = await client.query(query, values);
  return result.rows;
};

const insertTicketEvent = async (client, event) => {
  const rows = await insertTicketEvents(client, [event]);
  return rows[0];
};

export const createTicket = async ({ userId, message, circuitDescription, issueCategoryId, customerEmail }) => {
  return runInTransaction(async (client) => {
    // Determine creator's role
    const userRoleResult = await client.query(
      `SELECT role FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userRoleResult.rowCount === 0) {
      throw new AppError(401, "Creator user not found", "USER_NOT_FOUND");
    }

    const creatorRole = userRoleResult.rows[0].role;
    let customer;

    if (creatorRole === "SALES") {
      if (!customerEmail) {
        throw new AppError(400, "Customer email is required for Sales-initiated tickets", "BAD_REQUEST");
      }
      const customerResult = await client.query(
        `SELECT c.id FROM customers c JOIN users u ON u.id = c.user_id WHERE u.email = $1 LIMIT 1`,
        [customerEmail.trim().toLowerCase()]
      );
      if (customerResult.rowCount === 0) {
        throw new AppError(404, "Customer with this email was not found", "CUSTOMER_NOT_FOUND");
      }
      customer = customerResult.rows[0];
    } else {
      customer = await getCustomerProfileByUserId(client, userId);
      if (!customer) {
        throw new AppError(403, "Only customers can create tickets directly", "FORBIDDEN");
      }
    }

    if (!circuitDescription || circuitDescription.trim() === "") {
      throw new AppError(400, "Circuit description is required", "BAD_REQUEST");
    }

    const assignment = await findBestAgentForCategory(client, issueCategoryId);
    const assignedEmployeeId = assignment?.employee_id || null;

    const ticketResult = await client.query(
      `INSERT INTO tickets (
        customer_id,
        created_by_user_id,
        current_assigned_employee_id,
        primary_issue_category_id,
        status,
        circuit_description
      )
      VALUES ($1, $2, $3, $4, 'OPEN', $5)
      RETURNING id, ticket_no, customer_id, created_by_user_id, current_assigned_employee_id, primary_issue_category_id, status, circuit_description, created_at, updated_at, resolved_at, closed_at`,
      [customer.id, userId, assignedEmployeeId, issueCategoryId, circuitDescription],
    );

    const ticket = ticketResult.rows[0];
    const pendingEvents = [];

    pendingEvents.push({
      ticketId: ticket.id,
      actorUserId: userId,
      eventType: "TICKET_CREATED",
      message: message || "Ticket raised by Sales on behalf of customer",
      metadata: { source: creatorRole === "SALES" ? "sales" : "customer" },
      visibleToCustomer: true,
    });


    if (assignedEmployeeId) {
      const employeeResult = await client.query(
        `SELECT e.id, e.employee_id, u.name
         FROM employees e
         JOIN users u ON u.id = e.user_id
         WHERE e.id = $1
         LIMIT 1`,
        [assignedEmployeeId],
      );

      const employee = employeeResult.rows[0] || null;

      pendingEvents.push({
        ticketId: ticket.id,
        actorUserId: null,
        eventType: "TICKET_ASSIGNED",
        message: employee ? `Assigned to ${employee.name}` : "Ticket assigned",
        metadata: {
          assigned_employee_id: assignedEmployeeId,
          assigned_employee_name: employee?.name || null,
          assigned_by: "SYSTEM",
        },
        visibleToCustomer: true,
      });
    } else {
      pendingEvents.push({
        ticketId: ticket.id,
        actorUserId: null,
        eventType: "SYSTEM_MESSAGE",
        message: "No support agent is available. Ticket queued.",
        metadata: { reason: "NO_AVAILABLE_AGENT" },
        visibleToCustomer: true,
      });
    }

    const events = await insertTicketEvents(client, pendingEvents);

    // Send confirmation email
    const contact = await getCustomerContactByTicketId(client, ticket.id);
    const catRes = await client.query("SELECT name FROM issue_categories WHERE id = $1", [issueCategoryId]);
    const categoryName = catRes.rows[0]?.name || "General Support";

    if (contact) {
      sendTicketConfirmationEmail({
        name: contact.name,
        email: contact.email,
        ticketNo: contact.ticket_no,
        category: categoryName,
      }).catch(err => console.error("[EMAIL] Creation notification failed:", err));

      // Send immediate helpdesk registration notification
      sendTicketCreatedHelpdeskEmail({
        customerName: contact.name,
        ticketNo: contact.ticket_no,
        category: categoryName,
        circuitId: ticket.circuit_description
      }).catch(err => console.error("[EMAIL] Helpdesk creation notification failed:", err));

      // If an agent is assigned, notify immediately
      if (assignedEmployeeId) {
        const employeeResult = await client.query(
          `SELECT e.id, u.name, u.email FROM employees e JOIN users u ON u.id = e.user_id WHERE e.id = $1 LIMIT 1`,
          [assignedEmployeeId]
        );
        const employee = employeeResult.rows[0];
        if (employee) {
          sendImmediateAgentAssignmentEmails({
            customerName: contact.name,
            agentName: employee.name,
            agentEmail: employee.email,
            ticketNo: contact.ticket_no,
            category: categoryName,
            circuitId: ticket.circuit_description
          }).catch(err => console.error("[EMAIL] Immediate assignment notification failed:", err));
        }
      }
    }

    // Schedule Automated Follow-up Jobs
    try {
      const jobData = { ticketId: ticket.id };
      
      // 1. Agent Assignment Check at 2 minutes (120s)
      await ticketAutomationQueue.add("AGENT_ASSIGNMENT_CHECK", jobData, { delay: 2 * 60 * 1000 });
      
      // 2. Troubleshooting Update at 15 minutes (900s)
      await ticketAutomationQueue.add("TROUBLESHOOTING_UPDATE", jobData, { delay: 15 * 60 * 1000 });
      
      // 3. Final Activity Check at 45 minutes (2700s)
      await ticketAutomationQueue.add("FINAL_ACTIVITY_CHECK", jobData, { delay: 45 * 60 * 1000 });
      
      console.log(`[QUEUE] Scheduled automation sequence for Ticket #${ticket.id}`);
    } catch (err) {
      console.error("[QUEUE] Failed to schedule automation jobs:", err);
    }

    return {
      ticket,
      events,
    };
  });
};

export const addTicketEvent = async ({
  ticketId,
  actorUserId,
  message,
  visibleToCustomer = true,
}) => {
  return runInTransaction(async (client) => {
    const ticketResult = await client.query(
      `SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply
       FROM tickets
       WHERE id = $1
       FOR UPDATE`,
      [ticketId],
    );

    if (ticketResult.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    const ticket = ticketResult.rows[0];

    const actorResult = await client.query(
      `SELECT u.id AS user_id, u.role, u.name, e.id AS employee_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [actorUserId],
    );

    if (actorResult.rowCount === 0) {
      throw new AppError(401, "Actor not found", "ACTOR_NOT_FOUND");
    }

    const actor = actorResult.rows[0];

    if (actor.role === "USER") {
      if (!ticket.allow_customer_reply) {
        throw new AppError(403, "Customers cannot add ticket events at this time", "FORBIDDEN");
      }
      const isCustomerOwner = await client.query(
        `SELECT 1 FROM customers c JOIN tickets t ON t.customer_id = c.id WHERE t.id = $1 AND c.user_id = $2`,
        [ticketId, actorUserId]
      );
      if (isCustomerOwner.rowCount === 0) {
        throw new AppError(403, "You do not have access to this ticket", "FORBIDDEN");
      }
    }

    if (actor.role === "SUPPORT_AGENT") {
      if (!actor.employee_id || Number(ticket.current_assigned_employee_id) !== Number(actor.employee_id)) {
        throw new AppError(403, "Ticket is not assigned to this agent", "TICKET_NOT_ASSIGNED");
      }

      if (ticket.status === "CLOSED") {
        throw new AppError(409, "Closed tickets cannot be updated by support agents", "TICKET_CLOSED");
      }
    }

    const eventType =
      actor.role === "USER"
        ? "USER_REPLY"
        : actor.role === "SUPPORT_AGENT"
          ? visibleToCustomer
            ? "AGENT_REPLY"
            : "INTERNAL_NOTE"
          : actor.role === "MANAGER"
            ? visibleToCustomer
              ? "MANAGER_REPLY"
              : "INTERNAL_NOTE"
            : visibleToCustomer
              ? "ADMIN_REPLY"
              : "INTERNAL_NOTE";

    const event = await insertTicketEvent(client, {
      ticketId: ticket.id,
      actorUserId,
      eventType,
      message,
      metadata: {
        actor_role: actor.role,
        actor_name: actor.name,
      },
      visibleToCustomer,
    });

    const isEmployee = ["SUPPORT_AGENT", "ADMIN", "MANAGER"].includes(actor.role);
    const shouldUpdateStatus = ticket.status === "OPEN" && isEmployee;

    await client.query(
      `UPDATE tickets
       SET updated_at = NOW() ${shouldUpdateStatus ? ", status = 'IN_PROGRESS'" : ""}
       WHERE id = $1`,
      [ticket.id],
    );

    // Notify customer if it's an employee reply visible to customer
    if (isEmployee && visibleToCustomer) {
      getCustomerContactByTicketId(client, ticketId).then(contact => {
        if (contact) {
          sendTicketUpdateEmail({
            name: contact.name,
            email: contact.email,
            ticketNo: contact.ticket_no,
            agentName: actor.name,
            message: message
          }).catch(err => console.error("[EMAIL] Ticket update notification failed:", err));
        }
      });
    }

    // Emit real-time update
    ticketEventEmitter.emit("ticket_updated", { 
      ticketId, 
      data: { 
        type: "EVENT_ADDED", 
        event 
      } 
    });

    return event;

  });
};

export const getTicketTimeline = async ({ ticketId, requesterUserId }) => {
  const client = await postgresPool.connect();

  try {
    const ticketResult = await client.query(
      `
      SELECT
        t.id,
        t.ticket_no,
        t.status,
        t.created_by_user_id,
        ic.name AS subject,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,
        c.id AS customer_row_id,
        c.customer_id,
        cu.name AS customer_name,
        cu.email AS customer_email,
        t.current_assigned_employee_id,
        eu.name AS assigned_employee_name,
        t.circuit_description,
        t.rca,
        t.problem_side,
        t.external_ticket_no,
        t.rating,
        t.rating_feedback,
        t.allow_customer_reply
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN employees e ON e.id = t.current_assigned_employee_id
      LEFT JOIN users eu ON eu.id = e.user_id
      WHERE t.id = $1
      LIMIT 1
      `,
      [ticketId],
    );

    if (ticketResult.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    const ticket = ticketResult.rows[0];

    // Automatically close resolved tickets that are older than 24 hours
    if (ticket.status === "RESOLVED" && ticket.resolved_at) {
      const resolvedAt = new Date(ticket.resolved_at);
      const now = new Date();
      const diffHours = (now.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) {
        await client.query(
          `UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [ticketId]
        );
        await client.query(
          `INSERT INTO ticket_events (ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ticketId,
            null,
            "STATUS_CHANGED",
            "Ticket automatically closed after 24 hours of resolution.",
            JSON.stringify({ status: "CLOSED", autoClosed: true }),
            true
          ]
        );
        
        ticket.status = "CLOSED";
        ticket.closed_at = now;
        ticket.updated_at = now;
      }
    }

    const requesterResult = await client.query(
      `
      SELECT u.id, u.role, e.id AS employee_id
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
      `,
      [requesterUserId],
    );

    if (requesterResult.rowCount === 0) {
      throw new AppError(401, "Requester not found", "REQUESTER_NOT_FOUND");
    }

    const requester = requesterResult.rows[0];

    const isOwner = ticket.customer_row_id && ticket.customer_row_id === ticket.customer_row_id
      ? false
      : false;

    const isCustomerOwner = await client.query(
      `SELECT 1
       FROM customers
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [ticket.customer_row_id, requesterUserId],
    );

    const isAssignedAgent =
      requester.role === "SUPPORT_AGENT" &&
      requester.employee_id &&
      Number(requester.employee_id) === Number(ticket.current_assigned_employee_id);

    const isCreator = Number(ticket.created_by_user_id) === Number(requesterUserId);

    const isPrivileged = requester.role === "MANAGER" || requester.role === "ADMIN";

    if (!(isCustomerOwner.rowCount > 0 || isAssignedAgent || isPrivileged || (requester.role === "SALES" && isCreator))) {
      throw new AppError(403, "You do not have access to this ticket", "FORBIDDEN");
    }

    // Customers and admins can now view the RCA. No longer hiding it.

    const eventsQuery = requester.role === "USER"
      ? `
      SELECT
        te.id,
        te.ticket_id,
        te.actor_user_id,
        u.name AS actor_name,
        te.event_type,
        te.message,
        te.metadata,
        te.visible_to_customer,
        te.created_at
      FROM ticket_events te
      LEFT JOIN users u ON u.id = te.actor_user_id
      WHERE te.ticket_id = $1 AND te.visible_to_customer = true
      ORDER BY te.created_at ASC, te.id ASC
      `
      : `
      SELECT
        te.id,
        te.ticket_id,
        te.actor_user_id,
        u.name AS actor_name,
        te.event_type,
        te.message,
        te.metadata,
        te.visible_to_customer,
        te.created_at
      FROM ticket_events te
      LEFT JOIN users u ON u.id = te.actor_user_id
      WHERE te.ticket_id = $1
      ORDER BY te.created_at ASC, te.id ASC
      `;

    const eventsResult = await client.query(eventsQuery, [ticketId]);

    return {
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticket_no,
        status: ticket.status,
        subject: ticket.subject,
        circuit_description: ticket.circuit_description,
        rca: ticket.rca,
        problem_side: ticket.problem_side,
        external_ticket_no: ticket.external_ticket_no,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        closed_at: ticket.closed_at,
        rating: ticket.rating,
        rating_feedback: ticket.rating_feedback,
        allow_customer_reply: ticket.allow_customer_reply,
        customer: {
          id: ticket.customer_row_id,
          customer_id: ticket.customer_id,
          name: ticket.customer_name,
          email: ticket.customer_email,
        },
        assigned_employee: ticket.current_assigned_employee_id
          ? {
            id: ticket.current_assigned_employee_id,
            name: ticket.assigned_employee_name,
          }
          : null,
      },
      events: eventsResult.rows,
    };
  } finally {
    client.release();
  }
};

const bulkCloseExpiredResolvedTickets = async (client) => {
  const expiredTicketsRes = await client.query(
    `SELECT id FROM tickets WHERE status = 'RESOLVED' AND resolved_at < NOW() - INTERVAL '24 hours'`
  );
  if (expiredTicketsRes.rowCount > 0) {
    for (const row of expiredTicketsRes.rows) {
      await client.query(
        `UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE WHERE id = $1`,
        [row.id]
      );
      await client.query(
        `INSERT INTO ticket_events (ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          row.id,
          null,
          "STATUS_CHANGED",
          "Ticket automatically closed after 24 hours of resolution.",
          JSON.stringify({ status: "CLOSED", autoClosed: true }),
          true
        ]
      );
    }
  }
};

export const listUserTickets = async ({ userId, ownership, statusGroup, page = 1, limit = 10 }) => {
  const client = await postgresPool.connect();
  const offset = (Number(page) - 1) * Number(limit);

  try {
    await bulkCloseExpiredResolvedTickets(client);
    const customer = await getCustomerProfileByUserId(client, userId);
    const employee = await getEmployeeProfileByUserId(client, userId);

    let query;
    let params;

    const baseSelect = `
      SELECT
        t.id,
        t.ticket_no,
        ic.name AS subject,
        t.status,
        t.created_at,
        t.updated_at,
        cu.name AS customer_name,
        eu.name AS assigned_employee_name,
        t.current_assigned_employee_id,
        COUNT(*) OVER() AS total_count
    `;

    const baseFrom = `
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN employees e ON e.id = t.current_assigned_employee_id
      LEFT JOIN users eu ON eu.id = e.user_id
    `;

    if (customer) {
      let filterClause = "WHERE t.customer_id = $1";
      if (statusGroup === "ACTIVE") {
        filterClause += " AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')";
      }
      query = `
        ${baseSelect}
        ${baseFrom}
        ${filterClause}
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [customer.id, limit, offset];
    } else if (employee) {
      if (employee.role === "SUPPORT_AGENT") {
        let filterClause = "WHERE t.current_assigned_employee_id = $1";
        if (statusGroup === "ACTIVE") {
          filterClause += " AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')";
        }
        query = `
          ${baseSelect}
          ${baseFrom}
          ${filterClause}
          ORDER BY t.created_at DESC
          LIMIT $2 OFFSET $3
        `;
        params = [employee.id, limit, offset];
      } else if (employee.role === "SALES") {
        let filterClauses = ["t.created_by_user_id = $1"];
        params = [userId];

        if (ownership === "ASSIGNED") {
          filterClauses.push(`t.current_assigned_employee_id IS NOT NULL`);
        } else if (ownership === "UNASSIGNED") {
          filterClauses.push(`t.current_assigned_employee_id IS NULL`);
        }

        if (statusGroup === "ACTIVE") {
          filterClauses.push(`t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')`);
        }

        const filterClause = "WHERE " + filterClauses.join(" AND ");

        params.push(limit, offset);
        query = `
          ${baseSelect}
          ${baseFrom}
          ${filterClause}
          ORDER BY t.created_at DESC
          LIMIT $2 OFFSET $3
        `;
      } else {
        // ADMIN/MANAGER role sees all with simplified filters
        let filterClauses = [];
        params = [];
        
        if (ownership === "ASSIGNED") {
          filterClauses.push(`t.current_assigned_employee_id IS NOT NULL`);
        } else if (ownership === "UNASSIGNED") {
          filterClauses.push(`t.current_assigned_employee_id IS NULL`);
        }

        if (statusGroup === "ACTIVE") {
          filterClauses.push(`t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')`);
        }

        const filterClause = filterClauses.length > 0 ? "WHERE " + filterClauses.join(" AND ") : "";

        params.push(limit, offset);
        query = `
          ${baseSelect}
          ${baseFrom}
          ${filterClause}
          ORDER BY t.created_at DESC
          LIMIT $1 OFFSET $2
        `;
      }
    } else {
      throw new AppError(403, "Access denied", "FORBIDDEN");
    }

    const result = await client.query(query, params);
    const tickets = result.rows;
    const totalCount = tickets.length > 0 ? parseInt(tickets[0].total_count) : 0;

    return {
      tickets,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        limit: Number(limit),
      }
    };
  } finally {
    client.release();
  }
};

export const updateTicket = async ({ ticketId, status, actorUserId }) => {
  return runInTransaction(async (client) => {
    // 1. Fetch current ticket state
    const currentTicketRes = await client.query(
      `SELECT status, resolved_at, closed_at FROM tickets WHERE id = $1`,
      [ticketId]
    );

    if (currentTicketRes.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "NOT_FOUND");
    }

    const currentTicket = currentTicketRes.rows[0];

    // 2. Retrieve actor role
    const actorResult = await client.query(
      `SELECT role FROM users WHERE id = $1 LIMIT 1`,
      [actorUserId]
    );

    if (actorResult.rowCount === 0) {
      throw new AppError(401, "Actor not found", "UNAUTHORIZED");
    }

    const actorRole = actorResult.rows[0].role;

    // 3. Lifecycle Enforcements
    if (status) {
      // Rule: CLOSED tickets are permanently locked
      if (currentTicket.status === "CLOSED") {
        throw new AppError(400, "Closed tickets are permanently locked and cannot be reopened or updated.", "TICKET_LOCKED");
      }

      if (actorRole === "SALES") {
        throw new AppError(403, "Sales representatives cannot edit or update tickets.", "FORBIDDEN");
      }

      // Rule: Customer Role (USER) Security
      if (actorRole === "USER") {
        // Customer cannot set status to anything other than OPEN (reopening)
        if (status !== "OPEN") {
          throw new AppError(403, "Customers cannot close or resolve tickets. Only support agents can.", "FORBIDDEN");
        }

        // Customer can only reopen RESOLVED tickets
        if (currentTicket.status !== "RESOLVED") {
          throw new AppError(403, "Customers can only reopen tickets that are currently resolved.", "FORBIDDEN");
        }

        // Reopen window check (24 hours)
        const timestamp = currentTicket.resolved_at;
        if (timestamp) {
          const pastTime = new Date(timestamp);
          const now = new Date();
          const diffHours = (now.getTime() - pastTime.getTime()) / (1000 * 60 * 60);

          if (diffHours > 24) {
            await client.query(
              `UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE WHERE id = $1`,
              [ticketId]
            );
            await client.query(
              `INSERT INTO ticket_events (ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                ticketId,
                null,
                "STATUS_CHANGED",
                "Ticket automatically closed after 24 hours of resolution.",
                JSON.stringify({ status: "CLOSED", autoClosed: true }),
                true
              ]
            );
            throw new AppError(400, "The 24-hour window to reopen this ticket has expired.", "REOPEN_EXPIRED");
          }
        }
      }

      // Rule: Support/Employee Role Security
      if (["SUPPORT_AGENT", "MANAGER", "ADMIN"].includes(actorRole)) {
        // Agents cannot reopen resolved tickets
        if (status === "OPEN" && currentTicket.status === "RESOLVED") {
          throw new AppError(403, "Agents cannot reopen resolved tickets. Only customers can reopen them within 24 hours.", "FORBIDDEN");
        }
      }

      // Rule: ESCALATE allowed from OPEN or IN_PROGRESS
      if (status === "ESCALATED" && !["OPEN", "IN_PROGRESS"].includes(currentTicket.status)) {
        throw new AppError(400, "Only open or in-progress tickets can be escalated.", "INVALID_TRANSITION");
      }

      // Rule: CLOSED requires ticket to be RESOLVED first AND RCA must be filled
      if (status === "CLOSED") {
        if (currentTicket.status !== "RESOLVED") {
          throw new AppError(400, "Tickets can only be closed after being resolved first.", "INVALID_TRANSITION");
        }
        const rcaCheck = await client.query(
          `SELECT rca FROM tickets WHERE id = $1`,
          [ticketId]
        );
        if (!rcaCheck.rows[0]?.rca || !rcaCheck.rows[0].rca.trim()) {
          throw new AppError(400, "RCA must be documented before closing the ticket.", "RCA_REQUIRED");
        }
      }
    }

    const fields = [];
    const params = [];
    let paramIdx = 1;

    if (status) {
      fields.push(`status = $${paramIdx++}`);
      params.push(status);
      
      if (status === "RESOLVED") {
        fields.push(`resolved_at = NOW()`);
        fields.push(`allow_customer_reply = FALSE`);
      }
      if (status === "CLOSED") {
        fields.push(`closed_at = NOW()`);
        fields.push(`allow_customer_reply = FALSE`);
      }
    }

    if (fields.length === 0) return null;

    params.push(ticketId);
    const query = `UPDATE tickets SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${paramIdx} RETURNING id, status, resolved_at, closed_at, updated_at, allow_customer_reply`;
    
    const result = await client.query(query, params);
    const updatedTicket = result.rows[0];

    // Log events
    if (status) {
      await insertTicketEvent(client, {
        ticketId,
        actorUserId,
        eventType: "STATUS_CHANGED",
        message: `Status updated to ${status}`,
        metadata: { status },
        visibleToCustomer: true
      });
    }

    // Automatically schedule auto-close in 24 hours when resolved
    if (status === "RESOLVED") {
      try {
        await ticketAutomationQueue.add(
          "CLOSE_RESOLVED_TICKET",
          { ticketId },
          { delay: 24 * 60 * 60 * 1000 } // 24 hours
        );
        console.log(`[QUEUE] Scheduled CLOSE_RESOLVED_TICKET for Ticket #${ticketId}`);
      } catch (err) {
        console.error("[QUEUE] Failed to schedule CLOSE_RESOLVED_TICKET job:", err);
      }
    }

    // Send notification email for status changes — but NOT for CLOSED
    if (status && status !== currentTicket.status && status !== "CLOSED") {
      let updateType = null;
      if (status === "OPEN" && ["RESOLVED", "CLOSED"].includes(currentTicket.status)) {
        updateType = "REOPENED";
      } else if (["RESOLVED", "CLOSED"].includes(status)) {
        updateType = "CLOSED";
      } else if (status === "ESCALATED") {
        updateType = "ESCALATED";
      }

      if (updateType) {
        const contact = await getCustomerContactByTicketId(client, ticketId);
        if (contact) {
          sendTicketStatusUpdateEmail({
            name: contact.name,
            email: contact.email,
            ticketNo: contact.ticket_no,
            status: status,
            updateType: updateType
          }).catch(err => console.error("[EMAIL] Status update notification failed:", err));
        }
      }
    }

    // Emit real-time update
    ticketEventEmitter.emit("ticket_updated", { 
      ticketId, 
      data: { 
        type: "TICKET_STATUS_UPDATED", 
        ticket: updatedTicket 
      } 
    });

    return updatedTicket;
  });
};

export const getAdminStats = async ({ userId, role } = {}) => {
  const client = await postgresPool.connect();
  try {
    await bulkCloseExpiredResolvedTickets(client);
    
    let statsQuery;
    let categoryQuery;
    let agentsQuery;
    let params = [];

    if (role === "SALES") {
      params = [userId];
      statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM tickets WHERE created_by_user_id = $1) as total_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') AND created_by_user_id = $1) as active_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'CLOSED' AND created_by_user_id = $1) as closed_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'RESOLVED' AND created_by_user_id = $1) as resolved_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'ESCALATED' AND created_by_user_id = $1) as escalated_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status IN ('RESOLVED', 'CLOSED') AND updated_at >= NOW() - INTERVAL '24 hours' AND created_by_user_id = $1) as resolved_today,
          (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '24 hours' AND created_by_user_id = $1) as tickets_last_24h,
          (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours' AND created_by_user_id = $1) as tickets_previous_24h,
          0 as active_agents,
          0 as total_agents
      `;
      categoryQuery = `
        SELECT ic.name, COALESCE(COUNT(t.id), 0) as count
        FROM issue_categories ic
        LEFT JOIN tickets t ON t.primary_issue_category_id = ic.id AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') AND t.created_by_user_id = $1
        WHERE ic.is_active = TRUE
        GROUP BY ic.id, ic.name
        ORDER BY count DESC, ic.name ASC
      `;
      agentsQuery = `
        SELECT 
          0 AS employee_id,
          '' AS name,
          '' AS role,
          0 AS total_assigned,
          0 AS active_assigned
        LIMIT 0
      `;
    } else {
      statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM tickets) as total_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')) as active_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'CLOSED') as closed_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'RESOLVED') as resolved_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'ESCALATED') as escalated_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status IN ('RESOLVED', 'CLOSED') AND updated_at >= NOW() - INTERVAL '24 hours') as resolved_today,
          (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '24 hours') as tickets_last_24h,
          (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours') as tickets_previous_24h,
          (SELECT COUNT(DISTINCT current_assigned_employee_id) FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')) as active_agents,
          (SELECT COUNT(*) FROM employees e JOIN users u ON u.id = e.user_id WHERE u.role = 'SUPPORT_AGENT') as total_agents
      `;
      categoryQuery = `
        SELECT ic.name, COALESCE(COUNT(t.id), 0) as count
        FROM issue_categories ic
        LEFT JOIN tickets t ON t.primary_issue_category_id = ic.id AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
        WHERE ic.is_active = TRUE
        GROUP BY ic.id, ic.name
        ORDER BY count DESC, ic.name ASC
      `;
      agentsQuery = `
        SELECT 
          e.id AS employee_id,
          u.name AS name,
          u.role AS role,
          COUNT(t.id)::integer AS total_assigned,
          COALESCE(SUM(CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') THEN 1 ELSE 0 END), 0)::integer AS active_assigned
        FROM employees e
        JOIN users u ON u.id = e.user_id
        LEFT JOIN tickets t ON t.current_assigned_employee_id = e.id
        WHERE u.role = 'SUPPORT_AGENT'
        GROUP BY e.id, u.name, u.role
        ORDER BY active_assigned DESC, u.name ASC
      `;
    }

    const statsRes = await client.query(statsQuery, params);
    const categoryRes = await client.query(categoryQuery, params);
    const agentsRes = await client.query(agentsQuery);
    console.log("CategoryRes: ", categoryRes.rows)

    return {
      summary: statsRes.rows[0],
      categories: categoryRes.rows,
      volumeMix: categoryRes.rows, // Alias for clarity in frontend
      agents: agentsRes.rows
    };
  } finally {
    client.release();
  }
};

export const getAgentStats = async (actorUserId) => {
  const client = await postgresPool.connect();
  try {
    await bulkCloseExpiredResolvedTickets(client);
    const employeeRes = await client.query(
      `SELECT id FROM employees WHERE user_id = $1 LIMIT 1`,
      [actorUserId]
    );

    if (employeeRes.rowCount === 0) {
      throw new AppError(404, "Agent profile not found", "AGENT_NOT_FOUND");
    }

    const agentId = employeeRes.rows[0].id;

    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1) as total_assigned,
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1 AND status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')) as active_tickets,
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1 AND status IN ('RESOLVED', 'CLOSED')) as total_resolved,
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1 AND status IN ('RESOLVED', 'CLOSED') AND updated_at >= NOW() - INTERVAL '24 hours') as resolved_today
      `;

    // const recentTicketsQuery = `
    //   SELECT
    //     t.id,
    //     t.ticket_no,
    //     ic.name AS subject,
    //     t.status,
    //     t.created_at,
    //     cu.name as customer_name
    //   FROM tickets t
    //   LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
    //   JOIN customers c ON c.id = t.customer_id
    //   JOIN users cu ON cu.id = c.user_id
    //   WHERE t.current_assigned_employee_id = $1
    //   ORDER BY t.updated_at DESC
    //   LIMIT 5
    // `;

    const recentTicketsQuery = `
      SELECT 
        t.id, 
        t.ticket_no, 
        ic.name AS subject, 
        t.status, 
        t.created_at,
        cu.name AS customer_name
      FROM tickets t
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      WHERE t.current_assigned_employee_id = $1
        AND t.status = 'OPEN'
      ORDER BY t.updated_at DESC
      LIMIT 5
    `;

    const statsRes = await client.query(statsQuery, [agentId]);
    const recentTicketsRes = await client.query(recentTicketsQuery, [agentId]);

    return {
      summary: statsRes.rows[0],
      recentTickets: recentTicketsRes.rows
    };
  } finally {
    client.release();
  }
};

export const reassignTicket = async ({ ticketId, employeeId, actorUserId }) => {
  return runInTransaction(async (client) => {
    // 1. Verify employee exists and is a support agent
    const employeeResult = await client.query(
      `SELECT e.id, u.name 
       FROM employees e 
       JOIN users u ON u.id = e.user_id 
       WHERE e.id = $1 AND u.role = 'SUPPORT_AGENT'`,
      [employeeId]
    );

    if (employeeResult.rowCount === 0) {
      throw new AppError(400, "Invalid support agent", "INVALID_AGENT");
    }

    const employee = employeeResult.rows[0];

    // 2. Update ticket
    const updateResult = await client.query(
      `UPDATE tickets 
       SET current_assigned_employee_id = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, ticket_no`,
      [employeeId, ticketId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    // 3. Add event
    await insertTicketEvent(client, {
      ticketId,
      actorUserId,
      eventType: "TICKET_ASSIGNED",
      message: `Ticket reassigned to ${employee.name}`,
      metadata: {
        assigned_employee_id: employeeId,
        assigned_employee_name: employee.name,
        is_reassign: true,
      },
      visibleToCustomer: true
    });

    // Notify customer and new agent
    const contactPromise = getCustomerContactByTicketId(client, ticketId);
    const agentPromise = getEmployeeDetailsById(client, employeeId);

    Promise.all([contactPromise, agentPromise]).then(([contact, agent]) => {
      if (contact && agent) {
        sendImmediateAgentAssignmentEmails({
          customerName: contact.name,
          agentName: agent.name,
          agentEmail: agent.email,
          ticketNo: contact.ticket_no,
          category: contact.category,
          circuitId: contact.circuit_description
        }).catch(err => console.error("[EMAIL] Reassignment notification failed:", err));
      }
    });

    // Emit real-time update
    ticketEventEmitter.emit("ticket_updated", { 
      ticketId, 
      data: { 
        type: "TICKET_REASSIGNED", 
        ticketId,
        assigned_employee: {
          id: employeeId,
          name: employee.name
        }
      } 
    });

    return updateResult.rows[0];

  });
};

export const listIssueCategories = async () => {
  const result = await postgresPool.query(
    `SELECT id, code, name
     FROM issue_categories
     WHERE is_active = TRUE
     ORDER BY name ASC`,
  );
  return result.rows;
};
export const updateTicketRca = async ({ ticketId, rca, actorUserId }) => {
  const updatedRca = await runInTransaction(async (client) => {
    // 1. Verify actor is an employee
    const employee = await getEmployeeProfileByUserId(client, actorUserId);
    if (!employee) {
      throw new AppError(403, "Only employees can update RCA", "FORBIDDEN");
    }

    // 2. Strict Role Check: Only Support Agent, Manager, and Admin can update RCA
    if (!["SUPPORT_AGENT", "MANAGER", "ADMIN"].includes(employee.role)) {
      throw new AppError(403, "Only authorized employees (Support Agent, Manager, Admin) can document or edit the RCA.", "FORBIDDEN");
    }

    // 2. Fetch ticket and check status
    const ticketRes = await client.query(
      "SELECT status FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (ticketRes.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    const ticket = ticketRes.rows[0];

    // RCA only allowed for RESOLVED or CLOSED tickets
    if (!["RESOLVED", "CLOSED"].includes(ticket.status)) {
      throw new AppError(
        400,
        "RCA can only be documented for resolved or closed tickets",
        "INVALID_TICKET_STATE"
      );
    }

    // 3. Update RCA
    const result = await client.query(
      `UPDATE tickets SET rca = $1, updated_at = NOW() WHERE id = $2 RETURNING id, rca`,
      [rca, ticketId]
    );

    const updatedRcaVal = result.rows[0];

    // Emit real-time update
    ticketEventEmitter.emit("ticket_updated", {
      ticketId,
      data: {
        type: "TICKET_RCA_UPDATED",
        rca: updatedRcaVal.rca,
      },
    });

    return updatedRcaVal;
  });

  // Send email outside the transaction
  try {
    const contact = await getCustomerContactByTicketId(postgresPool, ticketId);
    if (contact) {
      sendTicketRcaEmail({
        name: contact.name,
        email: contact.email,
        ticketNo: contact.ticket_no,
        rca: updatedRca.rca
      }).catch(err => console.error("[EMAIL] RCA update notification failed:", err));
    }
  } catch (err) {
    console.error("[EMAIL] Failed to send RCA update email:", err);
  }

  return updatedRca;
};

export const listResolvedTickets = async ({ page = 1, limit = 10, exportAll = false }) => {
  const client = await postgresPool.connect();
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const baseSelect = `
      SELECT
        t.id,
        t.ticket_no,
        ic.name AS category_name,
        t.status,
        t.rca,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,
        c.customer_id,
        cu.name AS customer_name,
        eu.name AS assigned_agent_name,
        COUNT(*) OVER() AS total_count
    `;

    const baseFrom = `
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN employees e ON e.id = t.current_assigned_employee_id
      LEFT JOIN users eu ON eu.id = e.user_id
    `;

    const whereClause = "WHERE t.status IN ('RESOLVED', 'CLOSED')";
    const orderBy = "ORDER BY COALESCE(t.resolved_at, t.closed_at) DESC, t.created_at DESC";
    
    let query;
    let params = [];

    if (exportAll) {
      query = `${baseSelect} ${baseFrom} ${whereClause} ${orderBy}`;
    } else {
      query = `${baseSelect} ${baseFrom} ${whereClause} ${orderBy} LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await client.query(query, params);
    const tickets = result.rows;
    const totalCount = tickets.length > 0 ? parseInt(tickets[0].total_count) : 0;

    return {
      tickets,
      pagination: {
        total: totalCount,
        pages: exportAll ? 1 : Math.ceil(totalCount / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  } finally {
    client.release();
  }
};

export const updateTicketOutageDetails = async ({ ticketId, problemSide, externalTicketNo, actorUserId }) => {
  return runInTransaction(async (client) => {
    // 1. Verify actor is an employee
    const employee = await getEmployeeProfileByUserId(client, actorUserId);
    if (!employee) {
      throw new AppError(403, "Only employees can update outage details", "FORBIDDEN");
    }

    // 2. Fetch ticket and check existence
    const ticketRes = await client.query(
      "SELECT id, problem_side, external_ticket_no FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (ticketRes.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    // 3. Update outage details
    const result = await client.query(
      `UPDATE tickets 
       SET problem_side = $1, external_ticket_no = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, problem_side, external_ticket_no`,
      [problemSide || null, externalTicketNo || null, ticketId]
    );

    const updatedTicket = result.rows[0];

    // 4. Add system event
    const event = await insertTicketEvent(client, {
      ticketId,
      actorUserId,
      eventType: "OUTAGE_DETAILS_CHANGED",
      message: `Outage details updated: Problem side = ${problemSide || "None"}, Ticket No = ${externalTicketNo || "None"}`,
      metadata: { problem_side: problemSide, external_ticket_no: externalTicketNo },
      visibleToCustomer: false
    });

    const actorRes = await client.query("SELECT name FROM users WHERE id = $1", [actorUserId]);
    const actorName = actorRes.rowCount > 0 ? actorRes.rows[0].name : null;
    const socketEvent = {
      id: Number(event.id),
      event_type: event.event_type,
      message: event.message,
      actor_name: actorName,
      created_at: event.created_at,
      metadata: event.metadata,
      visible_to_customer: event.visible_to_customer
    };

    // 5. Emit socket event
    ticketEventEmitter.emit("ticket_updated", {
      ticketId,
      data: {
        type: "TICKET_OUTAGE_UPDATED",
        ticket: updatedTicket,
        event: socketEvent
      }
    });

    return updatedTicket;
  });
};

export const updateTicketRating = async ({ ticketId, rating, feedback, actorUserId }) => {
  return runInTransaction(async (client) => {
    // 1. Verify ticket exists and belongs to customer matching actorUserId
    const ticketResult = await client.query(
      `SELECT t.id, t.status, t.customer_id, c.user_id
       FROM tickets t
       JOIN customers c ON c.id = t.customer_id
       WHERE t.id = $1`,
      [ticketId]
    );

    if (ticketResult.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "TICKET_NOT_FOUND");
    }

    const ticket = ticketResult.rows[0];

    // Verify requesting user is the customer
    if (ticket.user_id !== actorUserId) {
      throw new AppError(403, "Only the ticket owner can rate this ticket", "FORBIDDEN");
    }

    // Verify ticket status is RESOLVED or CLOSED
    if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
      throw new AppError(400, "Only resolved or closed tickets can be rated", "INVALID_STATUS");
    }

    // Verify rating is between 1 and 5
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new AppError(400, "Rating must be an integer between 1 and 5", "INVALID_RATING");
    }

    // 2. Update ticket
    const updateResult = await client.query(
      `UPDATE tickets
       SET rating = $1,
           rating_feedback = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, ticket_no, rating, rating_feedback`,
      [rating, feedback || null, ticketId]
    );

    const resultTicket = updateResult.rows[0];

    // 4. Emit socket event
    ticketEventEmitter.emit("ticket_updated", {
      ticketId,
      data: {
        type: "TICKET_RATING_UPDATED",
        rating: resultTicket.rating,
        rating_feedback: resultTicket.rating_feedback,
      },
    });

    return resultTicket;
  });
};

export const toggleCustomerReply = async ({ ticketId, allowReply, actorUserId }) => {
  return runInTransaction(async (client) => {
    const ticketResult = await client.query(
      `SELECT id, status FROM tickets WHERE id = $1`,
      [ticketId]
    );

    if (ticketResult.rowCount === 0) {
      throw new AppError(404, "Ticket not found", "NOT_FOUND");
    }

    const result = await client.query(
      `UPDATE tickets SET allow_customer_reply = $1, updated_at = NOW() WHERE id = $2 RETURNING id, allow_customer_reply, updated_at`,
      [allowReply, ticketId]
    );

    const updatedTicket = result.rows[0];

    ticketEventEmitter.emit("ticket_updated", {
      ticketId,
      data: {
        type: "REPLY_TOGGLED",
        allow_customer_reply: allowReply
      }
    });

    return updatedTicket;
  });
};

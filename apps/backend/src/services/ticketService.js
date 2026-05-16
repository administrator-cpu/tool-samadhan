import postgresPool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { findBestAgentForCategory } from "./assignmentService.js";
import { sendTicketConfirmationEmail, sendTicketStatusUpdateEmail, sendTicketAssignmentEmails, sendTicketUpdateEmail } from "../utils/emailService.js";
import { ticketAutomationQueue } from "../config/queue.js";

const ACTIVE_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "ESCALATED"];

const getCustomerContactByTicketId = async (client, ticketId) => {
  const result = await client.query(
    `SELECT u.name, u.email, t.ticket_no, c.customer_id, ic.name as category, te.message
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

const pickPriorityFromText = (message) => {
  const text = `${message}`.toLowerCase();

  if (
    text.includes("down") ||
    text.includes("outage") ||
    text.includes("no internet") ||
    text.includes("internet not working") ||
    text.includes("critical") ||
    text.includes("urgent")
  ) {
    return "URGENT";
  }

  if (
    text.includes("slow") ||
    text.includes("lag") ||
    text.includes("packet loss") ||
    text.includes("disconnect")
  ) {
    return "HIGH";
  }

  if (text.includes("billing") || text.includes("payment") || text.includes("invoice")) {
    return "MEDIUM";
  }

  return "LOW";
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

export const createTicket = async ({ userId, message, issueCategoryId }) => {
  return runInTransaction(async (client) => {
    const customer = await getCustomerProfileByUserId(client, userId);

    if (!customer) {
      throw new AppError(403, "Only customers can create tickets", "FORBIDDEN");
    }

    const priority = pickPriorityFromText(message);
    const assignment = await findBestAgentForCategory(client, issueCategoryId);
    const assignedEmployeeId = assignment?.employee_id || null;

    const ticketResult = await client.query(
      `INSERT INTO tickets (
        customer_id,
        created_by_user_id,
        current_assigned_employee_id,
        primary_issue_category_id,
        status,
        priority
      )
      VALUES ($1, $2, $3, $4, 'OPEN', $5)
      RETURNING id, ticket_no, customer_id, created_by_user_id, current_assigned_employee_id, primary_issue_category_id, status, priority, created_at, updated_at, resolved_at, closed_at`,
      [customer.id, userId, assignedEmployeeId, issueCategoryId, priority],
    );

    const ticket = ticketResult.rows[0];
    const pendingEvents = [];

    pendingEvents.push({
      ticketId: ticket.id,
      actorUserId: userId,
      eventType: "TICKET_CREATED",
      message,
      metadata: { source: "customer" },
      visibleToCustomer: true,
    });

    pendingEvents.push({
      ticketId: ticket.id,
      actorUserId: null,
      eventType: "PRIORITY_ASSIGNED",
      message: `Priority set to ${priority}`,
      metadata: { priority, source: "auto-routing" },
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
        priority: ticket.priority,
      }).catch(err => console.error("[EMAIL] Creation notification failed:", err));

    }

    // Schedule Automated Follow-up Jobs
    try {
      const jobData = { ticketId: ticket.id };
      
      // 1. Agent Assignment Check at 5 minutes (300s)
      await ticketAutomationQueue.add("AGENT_ASSIGNMENT_CHECK", jobData, { delay: 5 * 60 * 1000 });
      
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
      `SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status
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
      throw new AppError(403, "Customers cannot add ticket events after creation", "FORBIDDEN");
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
      actor.role === "SUPPORT_AGENT"
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
        t.priority,
        ic.name AS subject,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,
        c.id AS customer_row_id,
        c.customer_id,
        cu.name AS customer_name,
        t.current_assigned_employee_id,
        eu.name AS assigned_employee_name,
        t.rca
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

    const isPrivileged = requester.role === "MANAGER" || requester.role === "ADMIN";

    if (!(isCustomerOwner.rowCount > 0 || isAssignedAgent || isPrivileged)) {
      throw new AppError(403, "You do not have access to this ticket", "FORBIDDEN");
    }

    // Hide RCA for customers
    if (requester.role === "USER") {
      ticket.rca = null;
    }

    const eventsResult = await client.query(
      `
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
      `,
      [ticketId],
    );

    return {
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticket_no,
        status: ticket.status,
        priority: ticket.priority,
        subject: ticket.subject,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        closed_at: ticket.closed_at,
        customer: {
          id: ticket.customer_row_id,
          customer_id: ticket.customer_id,
          name: ticket.customer_name,
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

export const listUserTickets = async ({ userId, ownership, page = 1, limit = 10 }) => {
  const client = await postgresPool.connect();
  const offset = (Number(page) - 1) * Number(limit);

  try {
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
        t.priority,
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
      query = `
        ${baseSelect}
        ${baseFrom}
        WHERE t.customer_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [customer.id, limit, offset];
    } else if (employee) {
      if (employee.role === "SUPPORT_AGENT") {
        query = `
          ${baseSelect}
          ${baseFrom}
          WHERE t.current_assigned_employee_id = $1
          ORDER BY t.created_at DESC
          LIMIT $2 OFFSET $3
        `;
        params = [employee.id, limit, offset];
      } else {
        // ADMIN role sees all with simplified ownership filter
        let filterClause = "";
        params = [limit, offset];
        
        if (ownership === "ASSIGNED") {
          filterClause = `WHERE t.current_assigned_employee_id IS NOT NULL`;
        } else if (ownership === "UNASSIGNED") {
          filterClause = `WHERE t.current_assigned_employee_id IS NULL`;
        }

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

export const updateTicket = async ({ ticketId, status, priority, actorUserId }) => {
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

    // 2. Lifecycle Enforcements
    if (status) {
      // Rule: REOPEN (RESOLVED or CLOSED -> OPEN) only allowed within 24 hours
      if (status === "OPEN" && ["RESOLVED", "CLOSED"].includes(currentTicket.status)) {
        const timestamp = currentTicket.status === "RESOLVED" 
          ? currentTicket.resolved_at 
          : currentTicket.closed_at;

        if (!timestamp) {
           // If for some reason there's no timestamp, we allow reopen to be safe or enforce a rule.
           // Usually there should be one.
        } else {
          const pastTime = new Date(timestamp);
          const now = new Date();
          const diffHours = (now.getTime() - pastTime.getTime()) / (1000 * 60 * 60);

          if (diffHours > 24) {
            // If it was already closed, keep it closed. If it was resolved, move to closed.
            if (currentTicket.status === "RESOLVED") {
              await client.query(`UPDATE tickets SET status = 'CLOSED', closed_at = NOW() WHERE id = $1`, [ticketId]);
            }
            throw new AppError(400, "The 24-hour window to reopen this ticket has expired.", "REOPEN_EXPIRED");
          }
        }
      }

      // Rule: ESCALATE allowed from OPEN or IN_PROGRESS
      if (status === "ESCALATED" && !["OPEN", "IN_PROGRESS"].includes(currentTicket.status)) {
        throw new AppError(400, "Only open or in-progress tickets can be escalated.", "INVALID_TRANSITION");
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
      }
      if (status === "CLOSED") {
        fields.push(`closed_at = NOW()`);
      }
    }

    if (priority) {
      fields.push(`priority = $${paramIdx++}`);
      params.push(priority);
    }

    if (fields.length === 0) return null;

    params.push(ticketId);
    const query = `UPDATE tickets SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${paramIdx} RETURNING id, status, priority`;
    
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

    if (priority) {
      await insertTicketEvent(client, {
        ticketId,
        actorUserId,
        eventType: "PRIORITY_ASSIGNED",
        message: `Priority updated to ${priority}`,
        metadata: { priority },
        visibleToCustomer: true
      });
    }

    // Send notification email for status changes
    if (status && status !== currentTicket.status) {
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

    return updatedTicket;
  });
};

export const getAdminStats = async () => {
  const client = await postgresPool.connect();
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM tickets) as total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')) as active_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'ESCALATED') as escalated_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('RESOLVED', 'CLOSED') AND updated_at >= NOW() - INTERVAL '24 hours') as resolved_today,
        (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '24 hours') as tickets_last_24h,
        (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours') as tickets_previous_24h,
        (SELECT COUNT(*) FROM tickets WHERE priority = 'URGENT' AND status != 'CLOSED') as urgent_tickets,
        (SELECT COUNT(DISTINCT current_assigned_employee_id) FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')) as active_agents,
        (SELECT COUNT(*) FROM employees e JOIN users u ON u.id = e.user_id WHERE u.role = 'SUPPORT_AGENT') as total_agents
    `;

    const categoryQuery = `
      SELECT ic.name, COALESCE(COUNT(t.id), 0) as count
      FROM issue_categories ic
      LEFT JOIN tickets t ON t.primary_issue_category_id = ic.id AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
      WHERE ic.is_active = TRUE
      GROUP BY ic.id, ic.name
      ORDER BY count DESC, ic.name ASC
    `;

    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM tickets
      WHERE status != 'CLOSED'
      GROUP BY priority
    `;

    const priorityVolumeQuery = `
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY count DESC
    `;

    const statsRes = await client.query(statsQuery);
    const categoryRes = await client.query(categoryQuery);
    const priorityRes = await client.query(priorityQuery);
    const priorityVolumeRes = await client.query(priorityVolumeQuery);
    console.log("CategoryRes: ", categoryRes.rows)

    return {
      summary: statsRes.rows[0],
      categories: categoryRes.rows,
      priorities: priorityRes.rows,
      priorityVolume: priorityVolumeRes.rows,
      volumeMix: categoryRes.rows // Alias for clarity in frontend
    };
  } finally {
    client.release();
  }
};

export const getAgentStats = async (actorUserId) => {
  const client = await postgresPool.connect();
  try {
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
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1 AND status IN ('RESOLVED', 'CLOSED') AND updated_at >= NOW() - INTERVAL '24 hours') as resolved_today,
        (SELECT COUNT(*) FROM tickets WHERE current_assigned_employee_id = $1 AND priority = 'URGENT' AND status != 'CLOSED') as urgent_count
    `;

    // const recentTicketsQuery = `
    //   SELECT
    //     t.id,
    //     t.ticket_no,
    //     ic.name AS subject,
    //     t.status,
    //     t.priority,
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
        t.priority, 
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
      },
      visibleToCustomer: true
    });

    // Notify customer and new agent
    const contactPromise = getCustomerContactByTicketId(client, ticketId);
    const agentPromise = getEmployeeDetailsById(client, employeeId);

    Promise.all([contactPromise, agentPromise]).then(([contact, agent]) => {
      if (contact && agent) {
        sendTicketAssignmentEmails({
          customerName: contact.name,
          customerEmail: contact.email,
          customerId: contact.customer_id,
          agentName: agent.name,
          agentEmail: agent.email,
          ticketNo: contact.ticket_no,
          category: contact.category,
          priority: "HIGH", // Defaulting to high for manual reassignments if not in contact
          message: contact.message || "Manual reassignment update.",
        }).catch(err => console.error("[EMAIL] Reassignment notification failed:", err));
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
  return runInTransaction(async (client) => {
    // 1. Verify actor is an employee
    const employee = await getEmployeeProfileByUserId(client, actorUserId);
    if (!employee) {
      throw new AppError(403, "Only employees can update RCA", "FORBIDDEN");
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

    return result.rows[0];
  });
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
        t.priority,
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

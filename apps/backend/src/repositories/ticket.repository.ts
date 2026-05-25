import { PoolClient, Pool } from 'pg';
import { Ticket } from '../types/models.js';
import { TicketStatus } from '../types/enums.js';

export class TicketRepository {
  static async create(
    client: PoolClient,
    data: {
      customerId: string;
      createdByUserId: string;
      assignedEmployeeId: string | null;
      issueCategoryId: string;
      circuitDescription: string;
    }
  ): Promise<Ticket> {
    const result = await client.query(
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
      [
        data.customerId,
        data.createdByUserId,
        data.assignedEmployeeId,
        data.issueCategoryId,
        data.circuitDescription,
      ]
    );
    return result.rows[0] as Ticket;
  }

  static async findByIdForUpdate(client: PoolClient, ticketId: string): Promise<Ticket | null> {
    const result = await client.query(
      `SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply, resolved_at, closed_at, rca, problem_side, external_ticket_no
       FROM tickets
       WHERE id = $1
       FOR UPDATE`,
      [ticketId]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as Ticket) : null;
  }

  static async findById(poolOrClient: Pool | PoolClient, ticketId: string): Promise<Ticket | null> {
    const result = await poolOrClient.query(
      `SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply, resolved_at, closed_at, rca, problem_side, external_ticket_no, circuit_description
       FROM tickets
       WHERE id = $1`,
      [ticketId]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as Ticket) : null;
  }

  static async getCustomerContactInfo(poolOrClient: Pool | PoolClient, ticketId: string) {
    const result = await poolOrClient.query(
      `SELECT u.name, u.email, t.ticket_no, c.customer_id, ic.name as category, te.message, t.circuit_description
       FROM tickets t
       JOIN customers c ON c.id = t.customer_id
       JOIN users u ON u.id = c.user_id
       JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
       LEFT JOIN ticket_events te ON te.ticket_id = t.id AND te.event_type = 'TICKET_CREATED'
       WHERE t.id = $1`,
      [ticketId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async updateStatus(
    client: PoolClient,
    ticketId: string,
    status: TicketStatus | string,
    additionalFields: string[] = []
  ): Promise<Ticket> {
    let query = `UPDATE tickets SET status = $1`;
    const params: any[] = [status];
    let paramIdx = 2;

    if (status === 'RESOLVED') {
      query += `, resolved_at = NOW(), allow_customer_reply = FALSE`;
    } else if (status === 'CLOSED') {
      query += `, closed_at = NOW(), allow_customer_reply = FALSE`;
    } else if (status === 'IN_PROGRESS' || status === 'OPEN' || status === 'ESCALATED') {
      // clear resolution timestamps if re-opening or progressing?
      // For now match existing logic: only set updated_at
    }

    for (const field of additionalFields) {
      query += `, ${field}`;
    }

    query += `, updated_at = NOW() WHERE id = $${paramIdx} RETURNING id, status, resolved_at, closed_at, updated_at, allow_customer_reply, rca, ticket_no, customer_id, circuit_description`;
    params.push(ticketId);

    const result = await client.query(query, params);
    return result.rows[0] as Ticket;
  }

  static async updateFields(
    client: PoolClient,
    ticketId: string,
    updates: Partial<Ticket>
  ): Promise<Ticket> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      throw new Error("No fields to update");
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(ticketId);

    const query = `
      UPDATE tickets
      SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await client.query(query, values);
    return result.rows[0] as Ticket;
  }

  static async bulkCloseExpiredResolvedTickets(poolOrClient: Pool | PoolClient): Promise<string[]> {
    const expiredTicketsRes = await poolOrClient.query(
      `SELECT id FROM tickets WHERE status = 'RESOLVED' AND resolved_at < NOW() - INTERVAL '24 hours' AND rca IS NOT NULL AND TRIM(rca) <> ''`
    );
    const closedIds: string[] = [];
    
    if (expiredTicketsRes.rowCount && expiredTicketsRes.rowCount > 0) {
      for (const row of expiredTicketsRes.rows) {
        await poolOrClient.query(
          `UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE WHERE id = $1`,
          [row.id]
        );
        closedIds.push(row.id);
      }
    }
    return closedIds;
  }

  static async findTicketTimelineInfo(client: PoolClient, ticketId: string) {
    const result = await client.query(
      `SELECT
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
        cu.phone AS customer_phone,
        t.current_assigned_employee_id,
        eu.name AS assigned_employee_name,
        eu.profile_image AS assigned_employee_profile_image,
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
      LIMIT 1`,
      [ticketId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async checkCustomerOwnership(client: PoolClient, customerRowId: string, userId: string): Promise<boolean> {
    const isCustomerOwner = await client.query(
      `SELECT 1
       FROM customers
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [customerRowId, userId]
    );
    return isCustomerOwner.rowCount !== null && isCustomerOwner.rowCount > 0;
  }

  static async findUserTickets(
    client: PoolClient,
    filters: {
      customerId?: string;
      employeeId?: string;
      salesUserId?: string;
      ownership?: string;
      statusGroup?: string;
      searchQuery?: string;
      sortField?: string;
      sortOrder?: string;
    },
    limit: number,
    offset: number
  ) {
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
        t.current_assigned_employee_id
    `;

    const baseFrom = `
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN employees e ON e.id = t.current_assigned_employee_id
      LEFT JOIN users eu ON eu.id = e.user_id
    `;

    const filterClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters.customerId) {
      filterClauses.push(`t.customer_id = $${paramIdx++}`);
      params.push(filters.customerId);
    } else if (filters.employeeId) {
      filterClauses.push(`t.current_assigned_employee_id = $${paramIdx++}`);
      params.push(filters.employeeId);
    } else if (filters.salesUserId) {
      filterClauses.push(`t.created_by_user_id = $${paramIdx++}`);
      params.push(filters.salesUserId);
    }

    if (filters.ownership === 'ASSIGNED') {
      filterClauses.push(`t.current_assigned_employee_id IS NOT NULL`);
    } else if (filters.ownership === 'UNASSIGNED') {
      filterClauses.push(`t.current_assigned_employee_id IS NULL`);
    }

    if (filters.statusGroup === 'ACTIVE') {
      filterClauses.push(`t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')`);
    }

    if (filters.searchQuery) {
      let q = filters.searchQuery.trim();
      if (/^\d+$/.test(q)) {
        q = `TCK-${q}`;
      }
      filterClauses.push(`t.ticket_no ILIKE $${paramIdx++}`);
      params.push(`%${q}%`);
    }

    const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

    // Separate count query to avoid window function overhead
    const countQuery = `SELECT COUNT(*) FROM tickets t ${whereClause}`;
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    let orderByClause = 'ORDER BY t.created_at DESC';
    if (filters.sortField && filters.sortOrder) {
      const allowedSortFields = ['created_at', 'status', 'ticket_no', 'updated_at'];
      const field = allowedSortFields.includes(filters.sortField) ? `t.${filters.sortField}` : 't.created_at';
      const order = filters.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderByClause = `ORDER BY ${field} ${order}`;
    }

    params.push(limit, offset);
    const dataQuery = `
      ${baseSelect}
      ${baseFrom}
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const dataResult = await client.query(dataQuery, params);

    return {
      tickets: dataResult.rows,
      total,
    };
  }

  static async findResolvedTickets(
    client: PoolClient,
    limit: number,
    offset: number,
    exportAll: boolean
  ) {
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
        eu.name AS assigned_agent_name
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

    // Separate count query
    let total = 0;
    if (!exportAll) {
      const countResult = await client.query(`SELECT COUNT(*) FROM tickets t ${whereClause}`);
      total = parseInt(countResult.rows[0].count, 10);
    }

    let query;
    const params: any[] = [];

    if (exportAll) {
      query = `${baseSelect} ${baseFrom} ${whereClause} ${orderBy}`;
    } else {
      query = `${baseSelect} ${baseFrom} ${whereClause} ${orderBy} LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const dataResult = await client.query(query, params);

    return {
      tickets: dataResult.rows,
      total: exportAll ? dataResult.rows.length : total,
    };
  }
}

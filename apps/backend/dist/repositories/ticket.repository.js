// from '../types/models.js';
export class TicketRepository {
    static async create(client, data) {
        const result = await client.query(`INSERT INTO tickets (
        customer_id,
        created_by_user_id,
        current_assigned_employee_id,
        primary_issue_category_id,
        status,
        circuit_description
      )
      VALUES ($1, $2, $3, $4, 'OPEN', $5)
      RETURNING id, ticket_no, customer_id, created_by_user_id, current_assigned_employee_id, primary_issue_category_id, status, circuit_description, created_at, updated_at, resolved_at, closed_at`, [
            data.customerId,
            data.createdByUserId,
            data.assignedEmployeeId,
            data.issueCategoryId,
            data.circuitDescription,
        ]);
        return result.rows[0];
    }
    static async findByIdForUpdate(client, ticketId) {
        const result = await client.query(`SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply, resolved_at, closed_at, rca, problem_side, external_ticket_no
       FROM tickets
       WHERE id = $1
       FOR UPDATE`, [ticketId]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    static async findById(poolOrClient, ticketId) {
        const result = await poolOrClient.query(`SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply, resolved_at, closed_at, rca, problem_side, external_ticket_no, circuit_description
       FROM tickets
       WHERE id = $1`, [ticketId]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    static async getCustomerContactInfo(poolOrClient, ticketId) {
        const result = await poolOrClient.query(`SELECT u.name, u.email, t.ticket_no, c.customer_id, ic.name as category, te.message, t.circuit_description
       FROM tickets t
       JOIN customers c ON c.id = t.customer_id
       JOIN users u ON u.id = c.user_id
       JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
       LEFT JOIN ticket_events te ON te.ticket_id = t.id AND te.event_type = 'TICKET_CREATED'
       WHERE t.id = $1`, [ticketId]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    static async updateStatus(client, ticketId, status, additionalFields = []) {
        let query = `UPDATE tickets SET status = $1`;
        const params = [status];
        let paramIdx = 2;
        if (status === 'RESOLVED') {
            query += `, resolved_at = NOW(), allow_customer_reply = FALSE`;
        }
        else if (status === 'CLOSED') {
            query += `, closed_at = NOW(), allow_customer_reply = FALSE`;
        }
        else if (status === 'IN_PROGRESS' || status === 'OPEN' || status === 'ESCALATED') {
            // clear resolution timestamps if re-opening or progressing?
            // For now match existing logic: only set updated_at
        }
        for (const field of additionalFields) {
            query += `, ${field}`;
        }
        query += `, updated_at = NOW() WHERE id = $${paramIdx} RETURNING id, status, resolved_at, closed_at, updated_at, allow_customer_reply, rca, ticket_no, customer_id, circuit_description`;
        params.push(ticketId);
        const result = await client.query(query, params);
        return result.rows[0];
    }
    static async updateFields(client, ticketId, updates) {
        const setClauses = [];
        const values = [];
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
        return result.rows[0];
    }
    static async bulkCloseExpiredResolvedTickets(poolOrClient) {
        const expiredTicketsRes = await poolOrClient.query(`SELECT id FROM tickets WHERE status = 'RESOLVED' AND resolved_at < NOW() - INTERVAL '24 hours' AND rca IS NOT NULL AND TRIM(rca) <> ''`);
        const closedIds = [];
        if (expiredTicketsRes.rowCount && expiredTicketsRes.rowCount > 0) {
            for (const row of expiredTicketsRes.rows) {
                await poolOrClient.query(`UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE WHERE id = $1`, [row.id]);
                closedIds.push(row.id);
            }
        }
        return closedIds;
    }
    static async findTicketTimelineInfo(client, ticketId) {
        const result = await client.query(`SELECT
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
      LIMIT 1`, [ticketId]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    static async checkCustomerOwnership(client, customerRowId, userId) {
        const isCustomerOwner = await client.query(`SELECT 1
       FROM customers
       WHERE id = $1 AND user_id = $2
       LIMIT 1`, [customerRowId, userId]);
        return isCustomerOwner.rowCount !== null && isCustomerOwner.rowCount > 0;
    }
    static async findUserTickets(client, filters, limit, offset) {
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
        const filterClauses = [];
        const params = [];
        let paramIdx = 1;
        if (filters.customerId) {
            filterClauses.push(`t.customer_id = $${paramIdx++}`);
            params.push(filters.customerId);
        }
        else if (filters.employeeId) {
            filterClauses.push(`t.current_assigned_employee_id = $${paramIdx++}`);
            params.push(filters.employeeId);
        }
        else if (filters.salesUserId) {
            filterClauses.push(`t.created_by_user_id = $${paramIdx++}`);
            params.push(filters.salesUserId);
        }
        if (filters.ownership === 'ASSIGNED') {
            filterClauses.push(`t.current_assigned_employee_id IS NOT NULL`);
        }
        else if (filters.ownership === 'UNASSIGNED') {
            filterClauses.push(`t.current_assigned_employee_id IS NULL`);
        }
        if (filters.statusGroup === 'ACTIVE') {
            filterClauses.push(`t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')`);
        }
        const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';
        // Separate count query to avoid window function overhead
        const countQuery = `SELECT COUNT(*) FROM tickets t ${whereClause}`;
        const countResult = await client.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);
        params.push(limit, offset);
        const dataQuery = `
      ${baseSelect}
      ${baseFrom}
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
        const dataResult = await client.query(dataQuery, params);
        return {
            tickets: dataResult.rows,
            total,
        };
    }
    static async findResolvedTickets(client, limit, offset, exportAll) {
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
        const params = [];
        if (exportAll) {
            query = `${baseSelect} ${baseFrom} ${whereClause} ${orderBy}`;
        }
        else {
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
//# sourceMappingURL=ticket.repository.js.map
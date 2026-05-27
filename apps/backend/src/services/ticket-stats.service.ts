import { postgresPool } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export class TicketStatsService {
  static async getAdminStats(userId: string, role: string) {
    const client = await postgresPool.connect();
    try {
      // 1. Basic Ticket Counts
      const countsRes = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM tickets 
        GROUP BY status
      `);
      
      const statusCounts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        ESCALATED: 0,
        RESOLVED: 0,
        CLOSED: 0,
        TOTAL: 0
      };
      
      countsRes.rows.forEach(row => {
        statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count, 10);
        statusCounts.TOTAL += parseInt(row.count, 10);
      });

      // Time-based stats
      const timeStatsRes = await client.query(`
        SELECT 
          COUNT(CASE WHEN status = 'RESOLVED' AND DATE(resolved_at AT TIME ZONE 'UTC') = CURRENT_DATE THEN 1 END) as resolved_today,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_previous_24h
        FROM tickets
      `);
      const timeStats = timeStatsRes.rows[0];

      // 3. Tickets by Category
      const categoryRes = await client.query(`
        SELECT ic.name, COUNT(t.id) as count
        FROM issue_categories ic
        LEFT JOIN tickets t ON t.primary_issue_category_id = ic.id
        GROUP BY ic.id, ic.name
        ORDER BY count DESC
      `);

      // 4. Agent Workload
      const workloadRes = await client.query(`
        SELECT 
          u.name,
          u.role,
          e.employee_id,
          e.id,
          COUNT(t.id) as total_assigned,
          COUNT(CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') THEN 1 END) as active_assigned
        FROM employees e
        JOIN users u ON u.id = e.user_id
        LEFT JOIN tickets t ON t.current_assigned_employee_id = e.id
        WHERE u.role = 'SUPPORT_AGENT'
        GROUP BY e.id, u.name, u.role, e.employee_id
        ORDER BY active_assigned DESC
      `);

      const total_agents = workloadRes.rows.length;
      const active_agents = workloadRes.rows.filter(r => parseInt(r.active_assigned, 10) > 0).length;

      return {
        summary: {
          total_tickets: statusCounts.TOTAL.toString(),
          active_tickets: (statusCounts.OPEN + statusCounts.IN_PROGRESS + statusCounts.ESCALATED).toString(),
          escalated_tickets: statusCounts.ESCALATED.toString(),
          resolved_today: timeStats.resolved_today.toString(),
          tickets_last_24h: timeStats.tickets_last_24h.toString(),
          tickets_previous_24h: timeStats.tickets_previous_24h.toString(),
          active_agents: active_agents.toString(),
          total_agents: total_agents.toString()
        },
        categories: categoryRes.rows,
        volumeMix: categoryRes.rows,
        agents: workloadRes.rows.map(row => ({
          employee_id: parseInt(row.employee_id, 10) || 0,
          name: row.name,
          role: row.role,
          total_assigned: parseInt(row.total_assigned, 10),
          active_assigned: parseInt(row.active_assigned, 10)
        }))
      };
    } finally {
      client.release();
    }
  }

  static async getSalesStats(userId: string) {
    const client = await postgresPool.connect();
    try {
      const countsRes = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM tickets 
        WHERE created_by_user_id = $1
        GROUP BY status
      `, [userId]);
      
      const statusCounts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        ESCALATED: 0,
        RESOLVED: 0,
        CLOSED: 0,
        TOTAL: 0
      };
      
      countsRes.rows.forEach(row => {
        statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count, 10);
        statusCounts.TOTAL += parseInt(row.count, 10);
      });

      return {
        summary: {
          total_tickets: statusCounts.TOTAL.toString(),
          active_tickets: (statusCounts.OPEN + statusCounts.IN_PROGRESS + statusCounts.ESCALATED).toString(),
          closed_tickets: statusCounts.CLOSED.toString(),
          resolved_tickets: statusCounts.RESOLVED.toString(),
        }
      };
    } finally {
      client.release();
    }
  }

  static async getAgentStats(userId: string) {
    const client = await postgresPool.connect();
    try {
      const empRes = await client.query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [userId]);
      if (empRes.rowCount === 0) {
         throw new AppError(404, 'Employee record not found', ErrorCodes.EMPLOYEE_NOT_FOUND);
      }
      const employeeId = empRes.rows[0].id;

      // 1. Summary stats
      const summaryRes = await client.query(`
        SELECT 
          COUNT(id) as total_assigned,
          COALESCE(SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') THEN 1 ELSE 0 END), 0) as active_tickets,
          COALESCE(SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END), 0) as total_resolved,
          COALESCE(SUM(CASE WHEN status = 'RESOLVED' AND updated_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END), 0) as resolved_today
        FROM tickets
        WHERE current_assigned_employee_id = $1
      `, [employeeId]);
      
      const summary = {
        total_assigned: summaryRes.rows[0].total_assigned || '0',
        active_tickets: summaryRes.rows[0].active_tickets || '0',
        total_resolved: summaryRes.rows[0].total_resolved || '0',
        resolved_today: summaryRes.rows[0].resolved_today || '0',
      };

      // 2. Recent Tickets
      const recentTicketsRes = await client.query(`
        SELECT t.id, t.ticket_no, ic.name as subject, t.status, t.created_at, u.name as customer_name
        FROM tickets t
        LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
        JOIN customers c ON c.id = t.customer_id
        JOIN users u ON u.id = c.user_id
        WHERE t.current_assigned_employee_id = $1
          AND t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
        ORDER BY t.updated_at DESC
        LIMIT 5
      `, [employeeId]);
      
      const recentTickets = recentTicketsRes.rows;

      return {
        summary,
        recentTickets
      };
    } finally {
      client.release();
    }
  }
}

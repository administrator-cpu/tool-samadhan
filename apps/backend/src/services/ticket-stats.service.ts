import { withTransaction, postgresPool } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { UserRole } from '../types/dto.js';

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

  static async getAgentStats(userId: string) {
    const client = await postgresPool.connect();
    try {
      const empRes = await client.query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [userId]);
      if (empRes.rowCount === 0) {
         throw new AppError(404, 'Employee record not found', ErrorCodes.EMPLOYEE_NOT_FOUND);
      }
      const employeeId = empRes.rows[0].id;

      // 1. My Assigned Tickets Counts
      const countsRes = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM tickets 
        WHERE current_assigned_employee_id = $1
        GROUP BY status
      `, [employeeId]);
      
      const statusCounts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        ESCALATED: 0,
        RESOLVED: 0,
        CLOSED: 0,
        TOTAL_ACTIVE: 0
      };
      
      countsRes.rows.forEach(row => {
        statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count, 10);
        if (['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(row.status)) {
           statusCounts.TOTAL_ACTIVE += parseInt(row.count, 10);
        }
      });

      // 2. Unassigned Active Tickets by Category (Opportunities)
      const unassignedRes = await client.query(`
        SELECT ic.name as category_name, COUNT(t.id) as count
        FROM tickets t
        JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
        JOIN employee_issue_categories eic ON eic.issue_category_id = ic.id
        WHERE t.current_assigned_employee_id IS NULL
          AND t.status NOT IN ('RESOLVED', 'CLOSED')
          AND eic.employee_id = $1
        GROUP BY ic.id, ic.name
      `, [employeeId]);

      // 3. Recently Assigned to Me (Last 24h)
      const recentlyAssignedRes = await client.query(`
        SELECT COUNT(DISTINCT ticket_id) as count
        FROM ticket_events
        WHERE event_type = 'TICKET_ASSIGNED'
          AND metadata->>'assigned_to' = $1
          AND created_at >= NOW() - INTERVAL '24 hours'
      `, [employeeId.toString()]); // Ensure it matches string representation in metadata

      return {
        myTickets: statusCounts,
        unassignedOpportunities: unassignedRes.rows,
        recentlyAssignedCount: parseInt(recentlyAssignedRes.rows[0]?.count || '0', 10)
      };
    } finally {
      client.release();
    }
  }
}

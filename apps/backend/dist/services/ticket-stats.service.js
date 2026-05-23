import { postgresPool } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
export class TicketStatsService {
    static async getAdminStats(userId, role) {
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
                statusCounts[row.status] = parseInt(row.count, 10);
                statusCounts.TOTAL += parseInt(row.count, 10);
            });
            // 2. Active Unassigned Tickets
            const unassignedRes = await client.query(`
        SELECT COUNT(*) as count 
        FROM tickets 
        WHERE current_assigned_employee_id IS NULL 
        AND status NOT IN ('RESOLVED', 'CLOSED')
      `);
            const unassignedCount = parseInt(unassignedRes.rows[0].count, 10);
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
          u.name as agent_name,
          e.employee_id,
          COUNT(t.id) as assigned_tickets,
          COUNT(CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED') THEN 1 END) as active_tickets
        FROM employees e
        JOIN users u ON u.id = e.user_id
        LEFT JOIN tickets t ON t.current_assigned_employee_id = e.id
        WHERE u.role = 'SUPPORT_AGENT'
        GROUP BY e.id, u.name, e.employee_id
        ORDER BY active_tickets DESC
      `);
            // 5. Recent Activity
            const activityRes = await client.query(`
        SELECT 
          te.id, te.ticket_id, t.ticket_no, te.event_type, 
          u.name as actor_name, te.created_at
        FROM ticket_events te
        JOIN tickets t ON t.id = te.ticket_id
        LEFT JOIN users u ON u.id = te.actor_user_id
        ORDER BY te.created_at DESC
        LIMIT 10
      `);
            // 6. User Stats
            const userRes = await client.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `);
            return {
                ticketCounts: statusCounts,
                unassignedActiveTickets: unassignedCount,
                ticketsByCategory: categoryRes.rows,
                agentWorkload: workloadRes.rows,
                recentActivity: activityRes.rows,
                userCounts: userRes.rows
            };
        }
        finally {
            client.release();
        }
    }
    static async getAgentStats(userId) {
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
                statusCounts[row.status] = parseInt(row.count, 10);
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
        }
        finally {
            client.release();
        }
    }
}
//# sourceMappingURL=ticket-stats.service.js.map
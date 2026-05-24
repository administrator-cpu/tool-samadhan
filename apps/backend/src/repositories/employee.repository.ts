import { PoolClient, Pool } from 'pg';
import { Employee } from '../types/models.js';

export class EmployeeRepository {
  static async create(client: PoolClient, userId: string): Promise<Employee> {
    const result = await client.query(
      `INSERT INTO employees (user_id)
       VALUES ($1)
       RETURNING id, employee_id, joined_at`,
      [userId]
    );
    return result.rows[0] as Employee;
  }

  static async findByUserId(client: PoolClient, userId: string): Promise<(Employee & { role: string; name: string }) | null> {
    const result = await client.query(
      `SELECT e.id, e.employee_id, u.role, u.name
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.user_id = $1
       LIMIT 1`,
      [userId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async findByRowId(client: PoolClient, employeeRowId: string): Promise<{ user_id: string } | null> {
    const result = await client.query(
      `SELECT user_id FROM employees WHERE id = $1 LIMIT 1`,
      [employeeRowId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async findAllWithCategories(pool: Pool, page: number = 1, limit: number = 10): Promise<{ employees: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM employees`);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(`
      SELECT 
        e.id as employee_row_id,
        e.employee_id,
        e.joined_at,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        COALESCE(
          json_agg(
            json_build_object('id', ic.id, 'name', ic.name)
          ) FILTER (WHERE ic.id IS NOT NULL),
          '[]'
        ) as categories
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employee_issue_categories eic ON e.id = eic.employee_id
      LEFT JOIN issue_categories ic ON eic.issue_category_id = ic.id
      GROUP BY e.id, u.id
      ORDER BY e.joined_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return { employees: result.rows, total };
  }

  static async findAllAgents(pool: Pool): Promise<any[]> {
    const result = await pool.query(`
      SELECT e.id, u.name, u.email
      FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.role = 'SUPPORT_AGENT'
      ORDER BY u.name ASC
    `);
    return result.rows;
  }

  static async replaceCategoriesByName(client: PoolClient, employeeRowId: string, categoryNames: string[]): Promise<void> {
    await client.query(
      `DELETE FROM employee_issue_categories WHERE employee_id = $1`,
      [employeeRowId]
    );
    
    if (categoryNames && categoryNames.length > 0) {
      await client.query(
        `INSERT INTO employee_issue_categories (employee_id, issue_category_id)
         SELECT $1, id FROM issue_categories WHERE name = ANY($2)`,
        [employeeRowId, categoryNames]
      );
    }
  }

  static async findBestAgentForCategory(client: PoolClient, categoryId: string): Promise<{ employee_id: string } | null> {
    if (!categoryId) return null;

    const result = await client.query(
      `
      WITH active_load AS (
        SELECT
          t.current_assigned_employee_id AS employee_id,
          COUNT(*)::int AS active_count
        FROM tickets t
        WHERE t.status = ANY($1::ticket_status[])
          AND t.current_assigned_employee_id IS NOT NULL
        GROUP BY t.current_assigned_employee_id
      )
      SELECT
        e.id AS employee_id,
        COALESCE(al.active_count, 0) AS active_count
      FROM employees e
      JOIN users u ON u.id = e.user_id
      JOIN employee_issue_categories eic ON eic.employee_id = e.id
      LEFT JOIN active_load al ON al.employee_id = e.id
      WHERE u.role = 'SUPPORT_AGENT'
        AND eic.issue_category_id = $2
      ORDER BY COALESCE(al.active_count, 0) ASC, e.joined_at ASC, e.id ASC
      LIMIT 1
      `,
      [['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'ESCALATED'], categoryId]
    );

    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }
}

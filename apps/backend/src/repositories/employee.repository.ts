import { db } from '../config/database.js';
import { employees, users, issueCategories, employeeIssueCategories, tickets } from '../database/drizzle/schema.js';
import { eq, inArray, isNotNull, desc, asc, count, sql, isNull } from 'drizzle-orm';
import { Employee } from '../types/models.js';

export class EmployeeRepository {
  static async create(tx: any, userId: string): Promise<Employee> {
    const result = await tx.insert(employees)
      .values({ user_id: parseInt(userId, 10) })
      .returning({ id: employees.id, employee_id: employees.employee_id, joined_at: employees.joined_at });
    
    return {
      ...result[0],
      id: String(result[0].id),
      user_id: userId,
      joined_at: result[0].joined_at
    } as Employee;
  }

  static async findByUserId(tx: any, userId: string): Promise<(Employee & { role: string; name: string }) | null> {
    const result = await tx.select({
      id: employees.id,
      employee_id: employees.employee_id,
      role: users.role,
      name: users.name
    })
    .from(employees)
    .innerJoin(users, eq(employees.user_id, users.id))
    .where(eq(employees.user_id, parseInt(userId, 10)))
    .limit(1);

    if (!result.length) return null;
    return { ...result[0], id: String(result[0].id) } as any;
  }

  static async findByRowId(tx: any, employeeRowId: string): Promise<{ user_id: string } | null> {
    const id = parseInt(employeeRowId, 10);
    if (isNaN(id)) return null;

    const result = await tx.query.employees.findFirst({
      where: eq(employees.id, id),
      columns: { user_id: true }
    });
    
    if (!result) return null;
    return { user_id: String(result.user_id) };
  }

  static async findAllWithCategories(tx: any, page: number = 1, limit: number = 10): Promise<{ employees: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const countRes = await tx.select({ value: count() }).from(employees);
    const total = countRes[0].value;

    const result = await tx.execute(sql`
      SELECT 
        e.id as employee_row_id,
        e.employee_id,
        e.joined_at,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.profile_image,
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
      LIMIT ${limit} OFFSET ${offset}
    `);

    return { employees: result.rows, total };
  }

  static async findAllAgents(tx: any): Promise<any[]> {
    const result = await tx.select({
      id: employees.id,
      name: users.name,
      email: users.email
    })
    .from(employees)
    .innerJoin(users, eq(employees.user_id, users.id))
    .where(eq(users.role, 'SUPPORT_AGENT'))
    .orderBy(asc(users.name));

    return result;
  }

  static async replaceCategoriesByName(tx: any, employeeRowId: string, categoryNames: string[]): Promise<void> {
    await tx.delete(employeeIssueCategories)
      .where(eq(employeeIssueCategories.employee_id, parseInt(employeeRowId, 10)));
    
    if (categoryNames && categoryNames.length > 0) {
      const cats = await tx.select({ id: issueCategories.id })
        .from(issueCategories)
        .where(inArray(issueCategories.name, categoryNames));
        
      if (cats.length > 0) {
        await tx.insert(employeeIssueCategories)
          .values(cats.map((c: any) => ({
            employee_id: parseInt(employeeRowId, 10),
            issue_category_id: c.id
          })));
      }
    }
  }

  static async findBestAgentForCategory(tx: any, categoryId: string): Promise<{ employee_id: string } | null> {
    if (!categoryId) return null;

    const result = await tx.execute(sql`
      WITH active_load AS (
        SELECT
          t.current_assigned_employee_id AS employee_id,
          COUNT(*)::int AS active_count
        FROM tickets t
        WHERE t.status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
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
        AND eic.issue_category_id = ${parseInt(categoryId, 10)}
      ORDER BY COALESCE(al.active_count, 0) ASC, e.joined_at ASC, e.id ASC
      LIMIT 1
    `);

    return result.rowCount && result.rowCount > 0 ? { employee_id: String(result.rows[0].employee_id) } : null;
  }
}

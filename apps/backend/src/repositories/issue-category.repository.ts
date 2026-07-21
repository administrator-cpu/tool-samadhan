import { db } from '../config/database.js';
import { issueCategories } from '../database/drizzle/schema.js';
import { eq, asc, sql } from 'drizzle-orm';
import { IssueCategory } from '../types/models.js';

export class IssueCategoryRepository {
  static async findAllActive(tx: any = db): Promise<IssueCategory[]> {
    const result = await tx.select({
      id: issueCategories.id,
      code: issueCategories.code,
      name: issueCategories.name
    })
    .from(issueCategories)
    .where(eq(issueCategories.is_active, true))
    .orderBy(asc(issueCategories.name));

    return result.map((r: any) => ({ ...r, id: String(r.id) })) as IssueCategory[];
  }

  static async findById(tx: any = db, id: string): Promise<IssueCategory | null> {
    const result = await tx.query.issueCategories.findFirst({
      where: eq(issueCategories.id, parseInt(id, 10)),
      columns: { id: true, code: true, name: true }
    });
    return result ? ({ ...result, id: String(result.id) } as any) : null;
  }

  static async findUnassigned(tx: any = db): Promise<IssueCategory[]> {
    const result = await tx.execute(sql`
      SELECT ic.id, ic.code, ic.name
      FROM issue_categories ic
      WHERE ic.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM employee_issue_categories eic
        JOIN employees e ON e.id = eic.employee_id
        JOIN users u ON u.id = e.user_id
        WHERE eic.issue_category_id = ic.id AND u.role = 'SUPPORT_AGENT'
      )
      ORDER BY ic.name ASC
    `);

    return result.rows.map((r: any) => ({ ...r, id: String(r.id) })) as IssueCategory[];
  }
}

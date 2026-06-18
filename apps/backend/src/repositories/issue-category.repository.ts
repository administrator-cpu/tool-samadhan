import { db } from '../config/database.js';
import { issueCategories } from '../database/drizzle/schema.js';
import { eq, asc } from 'drizzle-orm';
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
}

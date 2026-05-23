import { Pool, PoolClient } from 'pg';
import { IssueCategory } from '../types/models.js';

export class IssueCategoryRepository {
  static async findAllActive(pool: Pool): Promise<IssueCategory[]> {
    const result = await pool.query(
      `SELECT id, code, name
       FROM issue_categories
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    return result.rows as IssueCategory[];
  }

  static async findById(client: PoolClient | Pool, id: string): Promise<IssueCategory | null> {
    const result = await client.query(
      `SELECT id, code, name
       FROM issue_categories
       WHERE id = $1`,
      [id]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as IssueCategory) : null;
  }
}

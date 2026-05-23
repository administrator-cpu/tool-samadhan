import { Pool, PoolClient } from 'pg';
import { IssueCategory } from '../types/models.js';
export declare class IssueCategoryRepository {
    static findAllActive(pool: Pool): Promise<IssueCategory[]>;
    static findById(client: PoolClient | Pool, id: string): Promise<IssueCategory | null>;
}
//# sourceMappingURL=issue-category.repository.d.ts.map
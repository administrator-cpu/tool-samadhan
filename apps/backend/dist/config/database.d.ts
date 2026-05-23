import { Pool, PoolClient } from 'pg';
export declare const postgresPool: Pool;
/**
 * Utility function to manage database transactions.
 * Automates checking out a client, BEGIN, COMMIT/ROLLBACK, and release.
 */
export declare function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T>;
//# sourceMappingURL=database.d.ts.map
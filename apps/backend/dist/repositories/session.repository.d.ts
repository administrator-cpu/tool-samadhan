import { PoolClient, Pool } from 'pg';
import { Session } from '../types/models.js';
export declare class SessionRepository {
    static create(client: PoolClient, userId: string, tokenHash: string, jti: string, userAgent: string | null, ipAddress: string | null, expiresAt: Date): Promise<void>;
    static findActiveByJtiAndHashForUpdate(client: PoolClient, jti: string, tokenHash: string): Promise<Session | null>;
    static markRevoked(client: PoolClient, sessionId: string): Promise<void>;
    static markRevokedByJti(poolOrClient: Pool | PoolClient, jti: string, tokenHash: string): Promise<void>;
}
//# sourceMappingURL=session.repository.d.ts.map
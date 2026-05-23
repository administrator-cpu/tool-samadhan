import { PoolClient, Pool } from 'pg';
import { Session } from '../types/models.js';

export class SessionRepository {
  static async create(
    client: PoolClient,
    userId: string,
    tokenHash: string,
    jti: string,
    userAgent: string | null,
    ipAddress: string | null,
    expiresAt: Date
  ): Promise<void> {
    await client.query(
      `INSERT INTO sessions (
        user_id,
        token_hash,
        jti,
        user_agent,
        ip_address,
        expires_at,
        last_used_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, tokenHash, jti, userAgent, ipAddress, expiresAt]
    );
  }

  static async findActiveByJtiAndHashForUpdate(
    client: PoolClient,
    jti: string,
    tokenHash: string
  ): Promise<Session | null> {
    const result = await client.query(
      `SELECT id, user_id, revoked, revoked_at, expires_at
       FROM sessions
       WHERE jti = $1 AND token_hash = $2
       FOR UPDATE`,
      [jti, tokenHash]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as Session) : null;
  }

  static async markRevoked(client: PoolClient, sessionId: string): Promise<void> {
    await client.query(
      `UPDATE sessions
       SET revoked = TRUE,
           revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1`,
      [sessionId]
    );
  }

  static async markRevokedByJti(poolOrClient: Pool | PoolClient, jti: string, tokenHash: string): Promise<void> {
    await poolOrClient.query(
      `UPDATE sessions
       SET revoked = TRUE,
           revoked_at = NOW()
       WHERE jti = $1 AND token_hash = $2`,
      [jti, tokenHash]
    );
  }
}

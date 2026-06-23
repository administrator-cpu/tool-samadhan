import { db } from '../config/database.js';
import { sessions } from '../database/drizzle/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { Session } from '../types/models.js';

export class SessionRepository {
  static async create(
    tx: any = db,
    userId: string,
    tokenHash: string,
    jti: string,
    userAgent: string | null,
    ipAddress: string | null,
    expiresAt: Date
  ): Promise<void> {
    await tx.insert(sessions).values({
      user_id: parseInt(userId, 10),
      token_hash: tokenHash,
      jti: jti,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
      last_used_at: sql`NOW()`
    });
  }

  static async findActiveByJtiAndHashForUpdate(
    tx: any = db,
    jti: string,
    tokenHash: string
  ): Promise<Session | null> {
    const result = await tx.execute(sql`
      SELECT id, user_id, revoked, revoked_at, expires_at
      FROM sessions
      WHERE jti = ${jti} AND token_hash = ${tokenHash}
      FOR UPDATE
    `);
    return result.rowCount && result.rowCount > 0 ? ({ ...result.rows[0], id: String(result.rows[0].id) } as any) : null;
  }

  static async markRevoked(tx: any = db, sessionId: string): Promise<void> {
    await tx.execute(sql`
      UPDATE sessions
      SET revoked = TRUE,
          revoked_at = COALESCE(revoked_at, NOW())
      WHERE id = ${parseInt(sessionId, 10)}
    `);
  }

  static async markRevokedByJti(tx: any = db, jti: string, tokenHash: string): Promise<void> {
    await tx.execute(sql`
      UPDATE sessions
      SET revoked = TRUE,
          revoked_at = NOW()
      WHERE jti = ${jti} AND token_hash = ${tokenHash}
    `);
  }
}

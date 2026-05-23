export class SessionRepository {
    static async create(client, userId, tokenHash, jti, userAgent, ipAddress, expiresAt) {
        await client.query(`INSERT INTO sessions (
        user_id,
        token_hash,
        jti,
        user_agent,
        ip_address,
        expires_at,
        last_used_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [userId, tokenHash, jti, userAgent, ipAddress, expiresAt]);
    }
    static async findActiveByJtiAndHashForUpdate(client, jti, tokenHash) {
        const result = await client.query(`SELECT id, user_id, revoked, revoked_at, expires_at
       FROM sessions
       WHERE jti = $1 AND token_hash = $2
       FOR UPDATE`, [jti, tokenHash]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    static async markRevoked(client, sessionId) {
        await client.query(`UPDATE sessions
       SET revoked = TRUE,
           revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1`, [sessionId]);
    }
    static async markRevokedByJti(poolOrClient, jti, tokenHash) {
        await poolOrClient.query(`UPDATE sessions
       SET revoked = TRUE,
           revoked_at = NOW()
       WHERE jti = $1 AND token_hash = $2`, [jti, tokenHash]);
    }
}
//# sourceMappingURL=session.repository.js.map
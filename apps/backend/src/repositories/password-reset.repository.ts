import { PoolClient } from 'pg';

export class PasswordResetRepository {
  static async findLastOtp(client: PoolClient, userId: string): Promise<{ created_at: Date } | null> {
    const result = await client.query(
      `SELECT created_at 
       FROM password_reset_otps 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async deleteOtpsForUser(client: PoolClient, userId: string): Promise<void> {
    await client.query(`DELETE FROM password_reset_otps WHERE user_id = $1`, [userId]);
  }

  static async createOtp(
    client: PoolClient,
    userId: string,
    otpCode: string,
    expiresAt: Date
  ): Promise<void> {
    await client.query(
      `INSERT INTO password_reset_otps (user_id, otp_code, expires_at) 
       VALUES ($1, $2, $3)`,
      [userId, otpCode, expiresAt]
    );
  }

  static async verifyOtp(
    client: PoolClient,
    email: string,
    otpCode: string
  ): Promise<{ id: number; user_id: string; expires_at: Date } | null> {
    const result = await client.query(
      `SELECT pro.id, pro.user_id, pro.expires_at 
       FROM password_reset_otps pro 
       JOIN users u ON u.id = pro.user_id 
       WHERE u.email = $1 AND pro.otp_code = $2 
       LIMIT 1`,
      [email.toLowerCase(), otpCode]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }
}

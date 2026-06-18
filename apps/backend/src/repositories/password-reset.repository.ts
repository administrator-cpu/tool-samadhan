import { db } from '../config/database.js';
import { passwordResetOtps, users } from '../database/drizzle/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export class PasswordResetRepository {
  static async findLastOtp(tx: any = db, userId: string): Promise<{ created_at: Date } | null> {
    const result = await tx.query.passwordResetOtps.findFirst({
      where: eq(passwordResetOtps.user_id, parseInt(userId, 10)),
      orderBy: [desc(passwordResetOtps.created_at)],
      columns: { created_at: true }
    });
    return result || null;
  }

  static async deleteOtpsForUser(tx: any = db, userId: string): Promise<void> {
    await tx.delete(passwordResetOtps).where(eq(passwordResetOtps.user_id, parseInt(userId, 10)));
  }

  static async createOtp(
    tx: any = db,
    userId: string,
    otpCode: string,
    expiresAt: Date
  ): Promise<void> {
    await tx.insert(passwordResetOtps).values({
      user_id: parseInt(userId, 10),
      otp_code: otpCode,
      expires_at: expiresAt
    });
  }

  static async verifyOtp(
    tx: any = db,
    email: string,
    otpCode: string
  ): Promise<{ id: number; user_id: string; expires_at: Date } | null> {
    const result = await tx.select({
      id: passwordResetOtps.id,
      user_id: passwordResetOtps.user_id,
      expires_at: passwordResetOtps.expires_at
    })
    .from(passwordResetOtps)
    .innerJoin(users, eq(passwordResetOtps.user_id, users.id))
    .where(and(
      eq(users.email, email.toLowerCase()),
      eq(passwordResetOtps.otp_code, otpCode)
    ))
    .limit(1);

    if (result.length > 0) {
      return { ...result[0], user_id: String(result[0].user_id) };
    }
    return null;
  }
}

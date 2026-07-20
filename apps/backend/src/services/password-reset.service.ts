import crypto from 'crypto';
import argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { UserRepository } from '../repositories/user.repository.js';
import { PasswordResetRepository } from '../repositories/password-reset.repository.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { sendPasswordResetEmail } from './email.service.js';
import { disconnectUser } from './socket.service.js';

export class PasswordResetService {
  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    return db.transaction(async (tx) => {
      const user = await UserRepository.findByEmail(tx, email);
      if (!user) {
        return { message: 'If this email exists in our system, you will receive a reset OTP shortly.' };
      }

      const lastOtp = await PasswordResetRepository.findLastOtp(tx, user.id);
      if (lastOtp) {
        const diffInMs = new Date().getTime() - lastOtp.created_at.getTime();
        const twoMinutes = 120 * 1000;
        if (diffInMs < twoMinutes) {
          throw new AppError(429, 'Please wait 2 minutes before requesting another OTP', ErrorCodes.RATE_LIMIT);
        }
      }

      await PasswordResetRepository.deleteOtpsForUser(tx, user.id);

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await PasswordResetRepository.createOtp(tx, user.id, otpCode, expiresAt);

      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        otpCode,
      });

      return { message: 'If this email exists in our system, you will receive a reset OTP shortly.' };
    });
  }

  static async verifyOtp(email: string, otpCode: string): Promise<void> {
    return db.transaction(async (tx) => {
      const otpRecord = await PasswordResetRepository.verifyOtp(tx, email, otpCode);

      if (!otpRecord) {
        throw new AppError(400, 'Invalid or expired OTP', ErrorCodes.INVALID_OTP);
      }

      if (new Date() > otpRecord.expires_at) {
        throw new AppError(400, 'OTP has expired', ErrorCodes.OTP_EXPIRED);
      }

      // Verification successful, we do not delete it yet until they provide the new password
    });
  }

  static async completePasswordReset(email: string, otpCode: string, newPassword: string): Promise<void> {
    return db.transaction(async (tx) => {
      const otpRecord = await PasswordResetRepository.verifyOtp(tx, email, otpCode);

      if (!otpRecord) {
        throw new AppError(400, 'Invalid or expired OTP', ErrorCodes.INVALID_OTP);
      }

      if (new Date() > otpRecord.expires_at) {
        throw new AppError(400, 'OTP has expired', ErrorCodes.OTP_EXPIRED);
      }

      const hashedPassword = await argon2.hash(newPassword);

      await UserRepository.updatePassword(tx, otpRecord.user_id, hashedPassword);
      
      // They reset via email, so they don't *must* change it again
      await UserRepository.clearMustChangePassword(tx, otpRecord.user_id);

      await PasswordResetRepository.deleteOtpsForUser(tx, otpRecord.user_id);

      // Force disconnect sockets to revoke any active sessions
      // We also do a bulk session revocation below
      await tx.execute(
        sql`UPDATE sessions SET revoked = TRUE, revoked_at = NOW() WHERE user_id = ${otpRecord.user_id}`
      );

      disconnectUser(otpRecord.user_id);
    });
  }
}

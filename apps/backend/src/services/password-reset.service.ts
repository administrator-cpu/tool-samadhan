import crypto from 'crypto';
import argon2 from 'argon2';
import { withTransaction } from '../config/database.js';
import { UserRepository } from '../repositories/user.repository.js';
import { PasswordResetRepository } from '../repositories/password-reset.repository.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { sendPasswordResetEmail } from './email.service.js';
import { disconnectUser } from './socket.service.js';
import { postgresPool } from '../config/database.js';

export class PasswordResetService {
  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    return withTransaction(async (client) => {
      const user = await UserRepository.findByEmail(client, email);
      if (!user) {
        return { message: 'If this email exists in our system, you will receive a reset OTP shortly.' };
      }

      const lastOtp = await PasswordResetRepository.findLastOtp(client, user.id);
      if (lastOtp) {
        const diffInMs = new Date().getTime() - lastOtp.created_at.getTime();
        const sixtySeconds = 60 * 1000;
        if (diffInMs < sixtySeconds) {
          throw new AppError(429, 'Please wait 60 seconds before requesting another OTP', ErrorCodes.RATE_LIMIT);
        }
      }

      await PasswordResetRepository.deleteOtpsForUser(client, user.id);

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await PasswordResetRepository.createOtp(client, user.id, otpCode, expiresAt);

      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        otpCode,
      });

      return { message: 'If this email exists in our system, you will receive a reset OTP shortly.' };
    });
  }

  static async verifyOtp(email: string, otpCode: string): Promise<void> {
    return withTransaction(async (client) => {
      const otpRecord = await PasswordResetRepository.verifyOtp(client, email, otpCode);

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
    return withTransaction(async (client) => {
      const otpRecord = await PasswordResetRepository.verifyOtp(client, email, otpCode);

      if (!otpRecord) {
        throw new AppError(400, 'Invalid or expired OTP', ErrorCodes.INVALID_OTP);
      }

      if (new Date() > otpRecord.expires_at) {
        throw new AppError(400, 'OTP has expired', ErrorCodes.OTP_EXPIRED);
      }

      const hashedPassword = await argon2.hash(newPassword);

      await UserRepository.updatePassword(client, otpRecord.user_id, hashedPassword);
      
      // They reset via email, so they don't *must* change it again
      await UserRepository.clearMustChangePassword(client, otpRecord.user_id);

      await PasswordResetRepository.deleteOtpsForUser(client, otpRecord.user_id);

      // Force disconnect sockets to revoke any active sessions
      // We also do a bulk session revocation below
      await client.query(
        `UPDATE sessions SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1`,
        [otpRecord.user_id]
      );

      disconnectUser(otpRecord.user_id);
    });
  }
}

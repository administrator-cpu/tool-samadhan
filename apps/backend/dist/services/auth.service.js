import argon2 from 'argon2';
import { withTransaction } from '../config/database.js';
import { UserRepository } from '../repositories/user.repository.js';
import { SessionRepository } from '../repositories/session.repository.js';
import { generateTokens, verifyRefreshToken, hashToken } from './jwt.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { disconnectUser } from './socket.service.js';
export class AuthService {
    static async loginUser(dto, reqMeta) {
        return withTransaction(async (client) => {
            const user = await UserRepository.findByEmail(client, dto.email);
            if (!user) {
                throw new AppError(401, 'Invalid credentials', ErrorCodes.INVALID_CREDENTIALS);
            }
            if (!user.password) {
                throw new AppError(401, 'Invalid credentials', ErrorCodes.INVALID_CREDENTIALS);
            }
            const validPassword = await argon2.verify(user.password, dto.password || '');
            if (!validPassword) {
                throw new AppError(401, 'Invalid credentials', ErrorCodes.INVALID_CREDENTIALS);
            }
            const { accessToken, refreshToken, jti } = generateTokens({
                userId: user.id,
                role: user.role,
                email: user.email,
            });
            const tokenHash = hashToken(refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await SessionRepository.create(client, user.id, tokenHash, jti, reqMeta.userAgent, reqMeta.ipAddress, expiresAt);
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    must_change_password: user.must_change_password,
                },
                accessToken,
                refreshToken,
            };
        });
    }
    static async refreshSession(refreshToken, reqMeta) {
        return withTransaction(async (client) => {
            let decoded;
            try {
                decoded = verifyRefreshToken(refreshToken);
            }
            catch (error) {
                throw error; // Will be AppError with INVALID_TOKEN or REFRESH_EXPIRED
            }
            const tokenHash = hashToken(refreshToken);
            const session = await SessionRepository.findActiveByJtiAndHashForUpdate(client, decoded.jti, tokenHash);
            if (!session) {
                // Session hijacking attempt or already logged out
                throw new AppError(401, 'Session is invalid or expired', ErrorCodes.INVALID_TOKEN);
            }
            if (session.revoked || session.expires_at < new Date()) {
                throw new AppError(401, 'Session revoked or expired', ErrorCodes.REFRESH_REVOKED);
            }
            const user = await UserRepository.findById(client, decoded.userId);
            if (!user) {
                throw new AppError(401, 'User not found', ErrorCodes.USER_NOT_FOUND);
            }
            // Invalidate old session
            await SessionRepository.markRevoked(client, session.id);
            // Create new session
            const newTokens = generateTokens({
                userId: user.id,
                role: user.role,
                email: user.email,
            });
            const newTokenHash = hashToken(newTokens.refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await SessionRepository.create(client, user.id, newTokenHash, newTokens.jti, reqMeta.userAgent, reqMeta.ipAddress, expiresAt);
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    must_change_password: user.must_change_password,
                },
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            };
        });
    }
    static async logoutSession(refreshToken) {
        return withTransaction(async (client) => {
            let decoded;
            try {
                decoded = verifyRefreshToken(refreshToken);
            }
            catch (error) {
                return; // Token already invalid, nothing to do
            }
            const tokenHash = hashToken(refreshToken);
            await SessionRepository.markRevokedByJti(client, decoded.jti, tokenHash);
            // Force disconnect sockets
            disconnectUser(decoded.userId);
        });
    }
}
//# sourceMappingURL=auth.service.js.map
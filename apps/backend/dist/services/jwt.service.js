import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/environment.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
export const generateTokens = (payload) => {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign({ ...payload, jti }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    const refreshToken = jwt.sign({ ...payload, jti }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
    return { accessToken, refreshToken, jti };
};
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.secret);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError(401, 'Access token has expired.', ErrorCodes.TOKEN_EXPIRED);
        }
        throw new AppError(401, 'Invalid access token.', ErrorCodes.INVALID_TOKEN);
    }
};
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.refreshSecret);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError(401, 'Refresh token has expired. Please login again.', ErrorCodes.REFRESH_EXPIRED);
        }
        throw new AppError(401, 'Invalid refresh token.', ErrorCodes.INVALID_TOKEN);
    }
};
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
//# sourceMappingURL=jwt.service.js.map
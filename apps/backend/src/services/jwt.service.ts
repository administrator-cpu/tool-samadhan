import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/environment.js';
import { JwtPayload } from '../types/dto.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export const generateTokens = (payload: JwtPayload) => {
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { ...payload, jti },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn as any }
  );

  const refreshToken = jwt.sign(
    { ...payload, jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn as any }
  );

  return { accessToken, refreshToken, jti };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Access token has expired.', ErrorCodes.TOKEN_EXPIRED);
    }
    throw new AppError(401, 'Invalid access token.', ErrorCodes.INVALID_TOKEN);
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Refresh token has expired. Please login again.', ErrorCodes.REFRESH_EXPIRED);
    }
    throw new AppError(401, 'Invalid refresh token.', ErrorCodes.INVALID_TOKEN);
  }
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

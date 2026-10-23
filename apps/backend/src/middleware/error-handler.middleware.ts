import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { logger } from '../lib/logger.js';
import { sendResponse } from '../utils/response.js';
import { sendServerErrorEmail } from '../services/email.service.js';
import { env } from '../config/environment.js';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return sendResponse({
      res,
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      data: {
        code: err.code,
        ...(err.details && { details: err.details })
      }
    });
  }

  // Handle specific PostgreSQL errors
  if (err.code === '23505') {
    // unique_violation
    return sendResponse({
      res,
      statusCode: 409,
      success: false,
      message: 'A record with this value already exists.',
      data: { code: ErrorCodes.DUPLICATE_KEY }
    });
  }

  if (err.code === '23503') {
    // foreign_key_violation
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: 'Referenced record does not exist.',
      data: { code: ErrorCodes.FOREIGN_KEY_VIOLATION }
    });
  }

  // Handle unexpected errors
  const causeMsg = err.cause ? (err.cause?.message || err.cause?.code || String(err.cause)) : null;
  logger.error('Unhandled error:', { err, ...(causeMsg ? { cause: err.cause } : {}) });

  const statusCode = err.status || 500;
  
  // Fire-and-forget an email alert for unexpected server errors (500s)

  if (statusCode >= 500 && env.nodeEnv === 'production') {
    const errorMessage = causeMsg ? `${err.message || 'Unknown error occurred'} (Cause: ${causeMsg})` : (err.message || 'Unknown error occurred');
    const stackTrace = err.stack ? (causeMsg ? `${err.stack}\nCause: ${err.cause?.stack || causeMsg}` : err.stack) : undefined;

    sendServerErrorEmail({
      timestamp: new Date().toISOString(),
      errorType: err.name || 'Unexpected Error',
      errorMessage,
      stackTrace,
      path: req.originalUrl,
      method: req.method,
      payload: req.body,
      user: req.user,
    }).catch(e => logger.error('[EMAIL-SERVICE] Failed to send server error email', e));
  }

  return sendResponse({
    res,
    statusCode,
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    data: { code: ErrorCodes.INTERNAL_ERROR }
  });
};

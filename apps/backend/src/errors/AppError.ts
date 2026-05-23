import { ErrorCode } from './error-codes.js';

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode | string;
  public details: any;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, code: ErrorCode | string = 'ERROR', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendResponse } from '../../utils/response.js';
import { ErrorCodes } from '../../errors/error-codes.js';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'Validation failed',
          data: { code: ErrorCodes.VALIDATION_ERROR, details },
        });
      }
      next(error);
    }
  };
};

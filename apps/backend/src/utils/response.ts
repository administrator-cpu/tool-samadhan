import { Response } from 'express';

export interface ApiResponseOptions {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: any;
  success?: boolean;
}

export const sendResponse = ({
  res,
  statusCode = 200,
  message = 'Operation successful',
  data = {},
  success = true
}: ApiResponseOptions) => {
  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};

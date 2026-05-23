import { ErrorCode } from './error-codes.js';
export declare class AppError extends Error {
    statusCode: number;
    code: ErrorCode | string;
    details: any;
    isOperational: boolean;
    constructor(statusCode: number, message: string, code?: ErrorCode | string, details?: any);
}
//# sourceMappingURL=AppError.d.ts.map
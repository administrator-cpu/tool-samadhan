export class AppError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    constructor(statusCode, message, code = 'ERROR', details = null) {
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
//# sourceMappingURL=AppError.js.map
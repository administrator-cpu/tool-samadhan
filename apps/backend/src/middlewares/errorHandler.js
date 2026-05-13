import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal server error";
  let details = err.details || null;

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token expired";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid token";
  } else if (err.code === "23505") {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    message = "Resource already exists";
  } else if (err.code === "23503") {
    statusCode = 409;
    code = "FOREIGN_KEY_VIOLATION";
    message = "Referenced record not found";
  } else if (err.code === "23502") {
    statusCode = 400;
    code = "NOT_NULL_VIOLATION";
    message = "Missing required field";
  }

  const payload = { statusCode, code, message };
  if (details) payload.details = details;

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  if (!(err instanceof AppError) && process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../services/jwt.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    console.log(`[AUTH] No token for ${req.method} ${req.url}`);
    return next(new AppError(401, "No access token provided", "NO_TOKEN"));
  }

  try {
    const token = header.split(" ")[1];
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    console.log(`[AUTH] Invalid token for ${req.method} ${req.url}: ${error.message}`);
    next(new AppError(401, "Invalid or expired access token", "INVALID_TOKEN"));
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized", "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden", "FORBIDDEN"));
    }

    next();
  };
};
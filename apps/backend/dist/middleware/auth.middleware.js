import { verifyAccessToken } from '../services/jwt.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
export const requireAuth = (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(new AppError(401, 'Please log in to access this resource.', ErrorCodes.NO_TOKEN));
    }
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError(401, 'Please log in to access this resource.', ErrorCodes.NO_TOKEN));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, 'You do not have permission to perform this action.', ErrorCodes.FORBIDDEN));
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map
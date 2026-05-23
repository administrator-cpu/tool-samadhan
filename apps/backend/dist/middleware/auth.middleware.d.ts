import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/dto.js';
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: UserRole[] | string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map
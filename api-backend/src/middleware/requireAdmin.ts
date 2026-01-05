import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Middleware to require admin role
 * Must be used AFTER authenticate middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - user is added by authenticate middleware
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
        throw new AppError('Admin access required', 403, 'FORBIDDEN');
    }
    next();
};

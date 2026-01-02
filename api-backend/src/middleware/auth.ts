import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
            userId: string;
            email: string;
        };

        // Get user profile to check role
        const profile = await prisma.profile.findUnique({
            where: { userId: decoded.userId },
            select: { id: true, role: true, email: true },
        });

        if (!profile) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.user = {
            id: profile.id,
            email: profile.email || decoded.email,
            role: profile.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(500).json({ error: 'Authentication error' });
    }
};

export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    next();
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);

        if (!process.env.JWT_SECRET) {
            next();
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
            userId: string;
            email: string;
        };

        const profile = await prisma.profile.findUnique({
            where: { userId: decoded.userId },
            select: { id: true, role: true, email: true },
        });

        if (profile) {
            req.user = {
                id: profile.id,
                email: profile.email || decoded.email,
                role: profile.role,
            };
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

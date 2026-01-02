import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const rateLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
        store[ip] = {
            count: 1,
            resetTime: now + WINDOW_MS,
        };
        next();
        return;
    }

    store[ip].count++;

    if (store[ip].count > MAX_REQUESTS) {
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((store[ip].resetTime - now) / 1000),
        });
        return;
    }

    next();
};

// Clean up old entries every hour
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (now > store[key].resetTime) {
            delete store[key];
        }
    });
}, 3600000);

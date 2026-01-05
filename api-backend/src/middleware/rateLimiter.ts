import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000');

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

/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `auth:${ip}`;
    const now = Date.now();
    const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const AUTH_MAX_REQUESTS = 5; // Only 5 attempts per 15 min

    if (!store[key] || now > store[key].resetTime) {
        store[key] = {
            count: 1,
            resetTime: now + AUTH_WINDOW_MS,
        };
        next();
        return;
    }

    store[key].count++;

    if (store[key].count > AUTH_MAX_REQUESTS) {
        res.status(429).json({
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
        });
        return;
    }

    next();
};

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    year: z.string().optional(),
    hospital: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Helper function to generate JWT
const generateToken = (userId: string, email: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
    );
};

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response, next) => {
    try {
        const data = signupSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('User already exists', 400, 'USER_EXISTS');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Create user and profile in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                },
            });

            const profile = await tx.profile.create({
                data: {
                    userId: user.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    year: data.year,
                    hospital: data.hospital,
                    role: 'resident',
                    status: 'approved',
                },
            });

            return { user, profile };
        });

        // Generate token
        const token = generateToken(result.user.id, result.user.email);

        res.status(201).json({
            token,
            user: {
                id: result.profile.id,
                email: result.user.email,
                firstName: result.profile.firstName,
                lastName: result.profile.lastName,
                role: result.profile.role,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { profile: true },
        });

        if (!user) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Check if profile exists
        if (!user.profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        res.json({
            token,
            user: {
                id: user.profile.id,
                email: user.email,
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                role: user.profile.role,
                status: user.profile.status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next) => {
    try {
        const { token: oldToken } = req.body;

        if (!oldToken) {
            throw new AppError('Token required', 400, 'TOKEN_REQUIRED');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        // Verify old token (ignore expiration)
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
            ignoreExpiration: true,
        }) as { userId: string; email: string };

        // Check if user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Generate new token
        const newToken = generateToken(user.id, user.email);

        res.json({ token: newToken });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        next(error);
    }
});

export default router;

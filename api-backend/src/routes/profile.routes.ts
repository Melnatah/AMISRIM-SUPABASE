import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const updateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    year: z.string().optional(),
    hospital: z.string().optional(),
});

// GET /api/profiles - Get all profiles (authenticated users)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const profiles = await prisma.profile.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(profiles);
    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/me - Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const profile = await prisma.profile.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/:id - Get profile by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;

        const profile = await prisma.profile.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                createdAt: true,
            },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// PUT /api/profiles/me - Update current user profile
router.put('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const data = updateProfileSchema.parse(req.body);

        const profile = await prisma.profile.update({
            where: { id: req.user.id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                updatedAt: true,
            },
        });

        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/profiles/:id - Update profile by ID (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            phone: z.string().optional(),
            year: z.string().optional(),
            hospital: z.string().optional(),
            role: z.enum(['admin', 'resident']).optional(),
            status: z.string().optional(),
        }).parse(req.body);

        const profile = await prisma.profile.update({
            where: { id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                updatedAt: true,
            },
        });

        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/profiles/:id - Delete profile (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;

        // Delete profile (will cascade to user due to relation)
        const profile = await prisma.profile.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        await prisma.user.delete({
            where: { id: profile.userId },
        });

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

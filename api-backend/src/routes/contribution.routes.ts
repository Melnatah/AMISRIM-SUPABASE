import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const contributionSchema = z.object({
    profileId: z.string().uuid(),
    amount: z.number().positive(),
    month: z.string().optional(),
    year: z.string().optional(),
    status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
    paymentMethod: z.string().optional(),
    paymentDate: z.string().datetime().optional(),
});

// GET /api/contributions
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        // If not admin, only show own contributions
        const where = req.user.role === 'admin'
            ? {}
            : { profileId: req.user.id };

        const contributions = await prisma.contribution.findMany({
            where,
            include: {
                profile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(contributions);
    } catch (error) {
        next(error);
    }
});

// POST /api/contributions (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = contributionSchema.parse(req.body);
        const contribution = await prisma.contribution.create({
            data: {
                ...data,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
            },
            include: {
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        res.status(201).json(contribution);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/contributions/:id (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = contributionSchema.partial().parse(req.body);
        const contribution = await prisma.contribution.update({
            where: { id },
            data: {
                ...data,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
            },
        });
        res.json(contribution);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/contributions/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.contribution.delete({ where: { id } });
        res.json({ message: 'Contribution deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

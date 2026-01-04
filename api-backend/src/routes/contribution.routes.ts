import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const contributionSchema = z.object({
    profileId: z.string().uuid().optional(),
    contributorName: z.string().optional(),
    contributorType: z.string().optional(),
    reason: z.string().optional(),
    amount: z.number().positive(),
    month: z.string().optional(),
    year: z.string().optional(),
    status: z.enum(['pending', 'paid', 'overdue']).default('paid'), // Default to paid as manual entry usually means cash received
    paymentMethod: z.string().optional(),
    paymentDate: z.string().datetime().optional(),
});

// GET /api/contributions - Everyone sees everything (Transparency for Caisse Commune)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const contributions = await prisma.contribution.findMany({
            include: {
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert Decimal to number for JSON serialization
        const contributionsWithNumberAmount = contributions.map(c => ({
            ...c,
            amount: Number(c.amount)
        }));

        res.json(contributionsWithNumberAmount);
    } catch (error) {
        next(error);
    }
});

// POST /api/contributions (admin only to ensure verified entries)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = contributionSchema.parse(req.body);
        const contribution = await prisma.contribution.create({
            data: {
                ...data,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(), // Default to now if paid
            }
        });

        res.status(201).json({
            ...contribution,
            amount: Number(contribution.amount)
        });
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

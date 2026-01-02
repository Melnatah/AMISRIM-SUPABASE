import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const attendanceSchema = z.object({
    profileId: z.string().uuid(),
    itemType: z.enum(['staff', 'epu', 'diu', 'stage']),
    itemId: z.string().uuid().optional(),
    status: z.enum(['pending', 'confirmed']).default('pending'),
});

// GET /api/attendance
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { profileId, itemType } = req.query;

        const where: any = {};
        if (profileId) where.profileId = profileId;
        if (itemType) where.itemType = itemType;

        const attendance = await prisma.attendance.findMany({
            where,
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

        res.json(attendance);
    } catch (error) {
        next(error);
    }
});

// POST /api/attendance
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = attendanceSchema.parse(req.body);
        const attendance = await prisma.attendance.create({ data });
        res.status(201).json(attendance);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/attendance/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({ where: { id } });
        res.json({ message: 'Attendance deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

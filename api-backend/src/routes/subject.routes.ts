import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const subjectSchema = z.object({
    moduleId: z.string().uuid(),
    title: z.string().min(1),
    category: z.string().optional(),
});

// GET /api/subjects
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { moduleId } = req.query;
        const subjects = await prisma.subject.findMany({
            where: moduleId ? { moduleId: moduleId as string } : undefined,
            include: { files: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(subjects);
    } catch (error) {
        next(error);
    }
});

// POST /api/subjects (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = subjectSchema.parse(req.body);
        const subject = await prisma.subject.create({ data });
        res.status(201).json(subject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/subjects/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.subject.delete({ where: { id } });
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

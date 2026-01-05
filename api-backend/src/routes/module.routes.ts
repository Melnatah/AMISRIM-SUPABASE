import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const moduleSchema = z.object({
    subjectId: z.string().uuid().optional(),
    name: z.string().min(1), // Renamed from title
    year: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
});

// GET /api/modules
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { subjectId, category } = req.query;

        const where: any = {};
        if (subjectId) where.subjectId = subjectId as string;
        if (category) where.category = category as string;

        const modules = await prisma.module.findMany({
            where,
            include: {
                files: true, // Only files, not subjects anymore
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert BigInt to Number for serialization
        const serializedModules = modules.map(m => ({
            ...m,
            files: m.files.map(f => ({
                ...f,
                size: Number(f.size)
            }))
        }));

        res.json(serializedModules);
    } catch (error) {
        next(error);
    }
});

// POST /api/modules (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = moduleSchema.parse(req.body);
        const module = await prisma.module.create({ data });
        res.status(201).json(module);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/modules/:id (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = moduleSchema.partial().parse(req.body);
        const module = await prisma.module.update({ where: { id }, data });
        res.json(module);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/modules/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.module.delete({ where: { id } });
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

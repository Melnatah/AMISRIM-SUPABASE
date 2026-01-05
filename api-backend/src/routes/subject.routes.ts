import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Updated schema matching new DB structure
const subjectSchema = z.object({
    name: z.string().min(1),
    year: z.coerce.number().optional(), // coerce handles strings like "1"
    category: z.string().optional(),
});

// GET /api/subjects
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { year, category } = req.query;

        const where: any = {};
        if (year) where.year = parseInt(year as string);
        if (category) where.category = category as string;

        const subjects = await prisma.subject.findMany({
            where,
            include: {
                modules: true,
                files: true
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert BigInt to Number for serialization if files exist
        const serializedSubjects = subjects.map((s: any) => ({
            ...s,
            files: s.files.map((f: any) => ({
                ...f,
                size: Number(f.size)
            }))
        }));

        res.json(serializedSubjects);
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

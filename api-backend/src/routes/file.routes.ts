import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const fileSchema = z.object({
    moduleId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    name: z.string().min(1),
    type: z.string().optional(),
    url: z.string().min(1), // Accept relative paths like /uploads/...
    size: z.number().int().positive().optional(),
});

// GET /api/files
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { moduleId, subjectId } = req.query;

        const where: any = {};
        if (moduleId) where.moduleId = moduleId;
        if (subjectId) where.subjectId = subjectId;

        const files = await prisma.file.findMany({
            where,
            include: {
                module: {
                    select: { name: true },
                },
                subject: {
                    select: { name: true },
                },
                uploader: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert BigInt to number for JSON serialization
        const filesWithNumberSize = files.map(f => ({
            ...f,
            size: f.size ? Number(f.size) : null
        }));

        res.json(filesWithNumberSize);
    } catch (error) {
        next(error);
    }
});

// POST /api/files (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const data = fileSchema.parse(req.body);
        const file = await prisma.file.create({
            data: {
                ...data,
                size: data.size ? BigInt(data.size) : null,
                uploadedBy: req.user.id,
            },
        });

        res.status(201).json({
            ...file,
            size: file.size ? Number(file.size) : null
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/files/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.file.delete({ where: { id } });
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

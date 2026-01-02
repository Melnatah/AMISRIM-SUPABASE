import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const settingSchema = z.object({
    key: z.string().min(1),
    value: z.string(),
});

// GET /api/settings
router.get('/', async (req, res: Response, next) => {
    try {
        const settings = await prisma.setting.findMany();
        // Convert to key-value object
        const settingsObj = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string | null>);
        res.json(settingsObj);
    } catch (error) {
        next(error);
    }
});

// PUT /api/settings/:key (admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { key } = req.params;
        const { value } = z.object({ value: z.string() }).parse(req.body);

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        res.json(setting);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

export default router;

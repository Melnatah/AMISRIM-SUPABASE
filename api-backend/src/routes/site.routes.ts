import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const siteSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    supervisor: z.string().optional(),
    duration: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    // residents removed from creation schema, managed via dedicated endpoints
});

const assignSchema = z.object({
    residentId: z.string().uuid(),
});

// GET /api/sites
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const sites = await prisma.site.findMany({
            include: {
                residents: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        year: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sites);
    } catch (error) {
        next(error);
    }
});

// POST /api/sites (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = siteSchema.parse(req.body);
        const site = await prisma.site.create({ data });
        res.status(201).json(site);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// POST /api/sites/:id/residents - Assign resident
router.post('/:id/residents', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const { residentId } = assignSchema.parse(req.body);

        // Update profile to link to this site
        const profile = await prisma.profile.update({
            where: { id: residentId },
            data: { siteId: id }
        });

        res.json({ message: 'Resident assigned', profile });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/sites/:id/residents/:residentId - Remove resident
router.delete('/:id/residents/:residentId', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { residentId } = req.params;

        // Unlink profile
        await prisma.profile.update({
            where: { id: residentId },
            data: { siteId: null }
        });

        res.json({ message: 'Resident removed from site' });
    } catch (error) {
        next(error);
    }
});

// PUT /api/sites/:id (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = siteSchema.partial().parse(req.body);
        const site = await prisma.site.update({ where: { id }, data });
        res.json(site);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/sites/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.site.delete({ where: { id } });
        res.json({ message: 'Site deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

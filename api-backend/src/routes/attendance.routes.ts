import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const attendanceSchema = z.object({
    itemType: z.enum(['staff', 'epu', 'diu', 'stage']),
    itemId: z.string().uuid().optional(),
}).passthrough();

// GET /api/attendance/me - Get current user's attendance
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const attendance = await prisma.attendance.findMany({
            where: { profileId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json(attendance);
    } catch (error) {
        next(error);
    }
});

// GET /api/attendance/pending - Get pending attendance (admin only)
router.get('/pending', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { status: 'pending' },
            include: {
                profile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        year: true,
                        hospital: true,
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

// GET /api/attendance/all - Get all attendance (admin only)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { startDate, endDate, status } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                profile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        year: true,
                        hospital: true,
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

// GET /api/attendance/export - Export attendance as CSV (admin only)
router.get('/export', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { startDate, endDate, status } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        year: true,
                        hospital: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Generate CSV
        const headers = ['Date', 'Heure', 'Nom', 'Prénom', 'Année', 'Hôpital', 'Type', 'Statut'];
        const rows = attendance.map(a => [
            new Date(a.createdAt).toLocaleDateString('fr-FR'),
            new Date(a.createdAt).toLocaleTimeString('fr-FR'),
            a.profile?.lastName || '',
            a.profile?.firstName || '',
            a.profile?.year || '',
            a.profile?.hospital || '',
            a.itemType,
            a.status === 'confirmed' ? 'Validé' : a.status === 'rejected' ? 'Rejeté' : 'En attente',
        ]);

        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=emargements_${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csv); // BOM for Excel compatibility
    } catch (error) {
        next(error);
    }
});

// POST /api/attendance - Declare attendance
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const data = attendanceSchema.parse(req.body);

        // Check if already declared today for this type
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await prisma.attendance.findFirst({
            where: {
                profileId: req.user.id,
                itemType: data.itemType,
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        if (existing) {
            return res.status(400).json({ error: 'Vous avez déjà émargé pour cette catégorie aujourd\'hui.' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                profileId: req.user.id,
                itemType: data.itemType,
                itemId: data.itemId,
                status: 'pending',
            },
        });

        res.status(201).json(attendance);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Erreur de validation', details: error.errors });
            return;
        }
        next(error);
    }
});

// PATCH /api/attendance/:id/validate - Validate/Reject attendance (admin only)
router.patch('/:id/validate', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['confirmed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status invalide. Doit être "confirmed" ou "rejected".' });
        }

        const attendance = await prisma.attendance.update({
            where: { id },
            data: { status },
        });

        res.json(attendance);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/attendance/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({ where: { id } });
        res.json({ message: 'Émargement supprimé' });
    } catch (error) {
        next(error);
    }
});

export default router;

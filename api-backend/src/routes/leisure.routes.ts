import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['voyage', 'pique-nique', 'fete']).optional(),
    eventDate: z.string().datetime().optional(),
    location: z.string().optional(),
    maxParticipants: z.number().int().positive().optional(),
    costPerPerson: z.number().positive().optional(),
});

const participantSchema = z.object({
    eventId: z.string().uuid(),
    profileId: z.string().uuid(),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

const contributionSchema = z.object({
    eventId: z.string().uuid(),
    profileId: z.string().uuid(),
    amount: z.number().positive(),
    paymentStatus: z.enum(['pending', 'paid']).default('pending'),
});

// GET /api/leisure/events
router.get('/events', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const events = await prisma.leisureEvent.findMany({
            include: {
                participants: {
                    include: {
                        profile: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                contributions: {
                    include: {
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert Decimal to number for JSON serialization
        const eventsWithNumbers = events.map(e => ({
            ...e,
            costPerPerson: e.costPerPerson ? Number(e.costPerPerson) : null,
            contributions: e.contributions.map(c => ({
                ...c,
                amount: Number(c.amount)
            }))
        }));

        res.json(eventsWithNumbers);
    } catch (error) {
        next(error);
    }
});

// POST /api/leisure/events (admin only)
router.post('/events', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const data = eventSchema.parse(req.body);
        const event = await prisma.leisureEvent.create({
            data: {
                ...data,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                createdBy: req.user.id,
            },
        });

        res.status(201).json({
            ...event,
            costPerPerson: event.costPerPerson ? Number(event.costPerPerson) : null
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/leisure/events/:id (admin only)
router.put('/events/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = eventSchema.partial().parse(req.body);
        const event = await prisma.leisureEvent.update({
            where: { id },
            data: {
                ...data,
                eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
            },
        });

        res.json({
            ...event,
            costPerPerson: event.costPerPerson ? Number(event.costPerPerson) : null
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/leisure/events/:id (admin only)
router.delete('/events/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.leisureEvent.delete({ where: { id } });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// GET /api/leisure/participants
router.get('/participants', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { eventId } = req.query;
        const participants = await prisma.leisureParticipant.findMany({
            where: eventId ? { eventId: eventId as string } : undefined,
            include: {
                profile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        res.json(participants);
    } catch (error) {
        next(error);
    }
});

// POST /api/leisure/participants
router.post('/participants', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = participantSchema.parse(req.body);
        const participant = await prisma.leisureParticipant.create({ data });
        res.status(201).json(participant);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/leisure/participants/:id (admin only)
router.put('/participants/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const { status } = z.object({ status: z.enum(['pending', 'approved', 'rejected']) }).parse(req.body);
        const participant = await prisma.leisureParticipant.update({
            where: { id },
            data: { status },
        });
        res.json(participant);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/leisure/participants/:id (admin only)
router.delete('/participants/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.leisureParticipant.delete({ where: { id } });
        res.json({ message: 'Participant deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// GET /api/leisure/contributions
router.get('/contributions', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { eventId } = req.query;
        const contributions = await prisma.leisureContribution.findMany({
            where: eventId ? { eventId: eventId as string } : undefined,
            include: {
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Convert Decimal to number for JSON serialization
        const contributionsWithNumbers = contributions.map(c => ({
            ...c,
            amount: Number(c.amount)
        }));

        res.json(contributionsWithNumbers);
    } catch (error) {
        next(error);
    }
});

// POST /api/leisure/contributions (admin only)
router.post('/contributions', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const data = contributionSchema.parse(req.body);
        const contribution = await prisma.leisureContribution.create({ data });
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

// DELETE /api/leisure/contributions/:id (admin only)
router.delete('/contributions/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        await prisma.leisureContribution.delete({ where: { id } });
        res.json({ message: 'Contribution deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

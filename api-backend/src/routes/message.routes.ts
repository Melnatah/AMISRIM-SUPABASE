import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { io } from '../server.js';

const router = Router();

const createMessageSchema = z.object({
    subject: z.string().optional(),
    content: z.string().min(1),
    priority: z.enum(['urgent', 'important', 'info']).default('info'),
    type: z.enum(['broadcast', 'alert', 'general']).optional(),
});

// GET /api/messages - Get all messages
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const messages = await prisma.message.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 messages
        });

        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// POST /api/messages - Create message (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const data = createMessageSchema.parse(req.body);

        // Get sender info
        const profile = await prisma.profile.findUnique({
            where: { id: req.user.id },
            select: { firstName: true, lastName: true, role: true },
        });

        const message = await prisma.message.create({
            data: {
                sender: profile ? `${profile.firstName} ${profile.lastName}` : 'Admin',
                role: req.user.role,
                subject: data.subject,
                content: data.content,
                priority: data.priority,
                type: data.type,
            },
        });

        // Emit WebSocket event for real-time update
        io.emit('message:new', message);

        res.status(201).json(message);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/messages/:id - Delete message (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;

        await prisma.message.delete({
            where: { id },
        });

        // Emit WebSocket event
        io.emit('message:deleted', { id });

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

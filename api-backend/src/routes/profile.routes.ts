import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        // Strict MIME type whitelist
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedExtensions = /jpeg|jpg|png|gif|webp/;

        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.includes(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non autorisé. Formats acceptés: ${allowedMimeTypes.join(', ')}`));
        }
    }
});

const updateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    year: z.string().optional(),
    hospital: z.string().optional(),
    avatar: z.string().optional(),
});

// GET /api/profiles - Get all profiles (authenticated users)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const profiles = await prisma.profile.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                avatar: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(profiles);
    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/me - Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const profile = await prisma.profile.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                avatar: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/:id - Get profile by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;

        const profile = await prisma.profile.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                avatar: true,
                status: true,
                createdAt: true,
            },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// POST /api/profiles/me/avatar - Upload avatar for current user
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        // OPTIMIZATION: Resize and compress image
        const originalPath = req.file.path;
        const optimizedFilename = `opt-${req.file.filename.split('.')[0]}.jpg`;
        const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);

        await sharp(originalPath)
            .resize(500, 500, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(optimizedPath);

        // Remove original large file to save space
        try {
            fs.unlinkSync(originalPath);
        } catch (err) {
            console.error('Error removing original file:', err);
        }

        const avatarUrl = `/uploads/avatars/${optimizedFilename}`;

        // Update profile with new avatar URL
        const profile = await prisma.profile.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                avatar: true,
                status: true,
                updatedAt: true,
            },
        });

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// PUT /api/profiles/me - Update current user profile
router.put('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const data = updateProfileSchema.parse(req.body);

        const profile = await prisma.profile.update({
            where: { id: req.user.id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                avatar: true,
                status: true,
                updatedAt: true,
            },
        });

        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// PUT /api/profiles/:id - Update profile by ID (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;
        const data = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            phone: z.string().optional(),
            year: z.string().optional(),
            hospital: z.string().optional(),
            role: z.enum(['admin', 'resident']).optional(),
            status: z.string().optional(),
        }).parse(req.body);

        const profile = await prisma.profile.update({
            where: { id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                year: true,
                hospital: true,
                phone: true,
                status: true,
                updatedAt: true,
            },
        });

        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        next(error);
    }
});

// DELETE /api/profiles/:id - Delete profile (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
    try {
        const { id } = req.params;

        // Delete profile (will cascade to user due to relation)
        const profile = await prisma.profile.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        await prisma.user.delete({
            where: { id: profile.userId },
        });

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

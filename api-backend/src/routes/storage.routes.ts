import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error as Error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|avi|mov/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

// POST /api/storage/upload - Upload a file
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/storage/upload-multiple - Upload multiple files
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const uploadedFiles = req.files.map((file) => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        }));

        res.status(201).json({ files: uploadedFiles });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/storage/:filename - Delete a file
router.delete('/:filename', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);

        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        next(error);
    }
});

export default router;

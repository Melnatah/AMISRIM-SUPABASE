import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';


// Import routes
import authRoutes from './routes/auth.routes.js';

// Polyfill for BigInt serialization
// @ts-ignore
BigInt.prototype.toJSON = function () { return Number(this) }

import { Prisma } from '@prisma/client';
// Polyfill for Decimal serialization
// @ts-ignore
Prisma.Decimal.prototype.toJSON = function () { return this.toNumber() }

import profileRoutes from './routes/profile.routes.js';
import siteRoutes from './routes/site.routes.js';
import moduleRoutes from './routes/module.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import fileRoutes from './routes/file.routes.js';
import contributionRoutes from './routes/contribution.routes.js';
import messageRoutes from './routes/message.routes.js';
import settingRoutes from './routes/setting.routes.js';
import leisureRoutes from './routes/leisure.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import storageRoutes from './routes/storage.routes.js';
import searchRoutes from './routes/search.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import Prisma client
import { prisma } from './lib/prisma.js';

// Import WebSocket handler
import { initializeWebSocket } from './websocket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const origin = process.env.CORS_ORIGIN?.includes(',')
    ? process.env.CORS_ORIGIN.split(',')
    : (process.env.CORS_ORIGIN || 'http://localhost:5173');

const io = new SocketIOServer(httpServer, {
    cors: {
        origin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Optimized compression for 150 concurrent users
app.use(compression({
    filter: (req, res) => {
        // Skip compression if client requests it
        if (req.headers['x-no-compression']) return false;
        // Use default compression filter
        return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression (1=fastest, 9=best compression)
    threshold: 1024, // Only compress responses > 1KB
}));

// HTTP request logging (combined format in production, dev format in development)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
    origin,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Static files for uploads with strong caching (30 days)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '30d',
    etag: true,
    lastModified: true
}));

// Health check with database verification
app.get('/health', async (req: Request, res: Response) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/leisure', leisureRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket
initializeWebSocket(io);

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

export { io };

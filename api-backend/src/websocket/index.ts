import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

export const initializeWebSocket = (io: SocketIOServer) => {
    // Middleware for authentication
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            if (!process.env.JWT_SECRET) {
                return next(new Error('JWT_SECRET not configured'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
                userId: string;
                email: string;
            };

            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join user-specific room
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Handle message events
        socket.on('message:send', (data) => {
            // Broadcast to all connected clients
            io.emit('message:new', data);
        });

        // Handle typing events
        socket.on('typing:start', (data) => {
            socket.broadcast.emit('typing:user', {
                userId: socket.userId,
                ...data,
            });
        });

        socket.on('typing:stop', () => {
            socket.broadcast.emit('typing:stop', {
                userId: socket.userId,
            });
        });

        // Handle presence
        socket.on('presence:online', () => {
            socket.broadcast.emit('presence:user-online', {
                userId: socket.userId,
            });
        });

        // Handle custom events
        socket.on('event:update', (data) => {
            io.emit('event:updated', data);
        });

        socket.on('contribution:update', (data) => {
            io.emit('contribution:updated', data);
        });

        socket.on('profile:update', (data) => {
            io.emit('profile:updated', data);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            socket.broadcast.emit('presence:user-offline', {
                userId: socket.userId,
            });
        });
    });

    return io;
};

// Helper function to emit to specific user
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
};

// Helper function to broadcast to all users
export const broadcastToAll = (io: SocketIOServer, event: string, data: any) => {
    io.emit(event, data);
};

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { socketAuth } from './socketAuth';
import registerChatHandlers from './handlers/chatHandler';
import registerPresenceHandlers from './handlers/presenceHandler';
import registerCallHandlers from './handlers/callHandler';
import { pubClient, subClient, redisClient } from '../config/redis';

let io: Server;

// Redis key helpers
const userSocketsKey = (userId: string) => `user:sockets:${userId}`;

/**
 * Register a socket for a user in Redis.
 * Uses a Redis Hash: user:sockets:{userId} → { [socketId]: '1' }
 */
const addUserSocket = async (userId: string, socketId: string): Promise<void> => {
    await redisClient.hset(userSocketsKey(userId), socketId, '1');
    // Expire after 24h as safety net (socket disconnect should clean it up)
    await redisClient.expire(userSocketsKey(userId), 86400);
};

/**
 * Remove a single socket for a user from Redis.
 */
const removeUserSocket = async (userId: string, socketId: string): Promise<void> => {
    await redisClient.hdel(userSocketsKey(userId), socketId);
};

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket] Redis adapter initialized');

    io.use(socketAuth);

    io.on('connection', async (socket: Socket) => {
        const userId = socket.data.userId as string;
        console.log(`[Socket] User ${userId} connected — socket ${socket.id}`);

        await addUserSocket(userId, socket.id);

        registerChatHandlers(io, socket);
        registerPresenceHandlers(io, socket, getUserSockets);
        registerCallHandlers(io, socket, getUserSockets);

        socket.on('disconnect', async () => {
            console.log(`[Socket] User ${userId} disconnected — socket ${socket.id}`);
            await removeUserSocket(userId, socket.id);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initSocket() first.');
    }
    return io;
};

export const getUserSockets = async (userId: string): Promise<string[]> => {
    try {
        const hash = await redisClient.hgetall(userSocketsKey(userId));
        return hash ? Object.keys(hash) : [];
    } catch {
        return [];
    }
};

/**
 * Emit an event to all sockets of a specific user across all instances.
 * With the Redis adapter, io.to() already broadcasts to all instances,
 * so we just need the socket IDs from Redis.
 */
export const emitToUser = async (userId: string, event: string, data: any): Promise<void> => {
    const socketIds = await getUserSockets(userId);
    socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data);
    });
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
    try {
        const count = await redisClient.hlen(userSocketsKey(userId));
        return count > 0;
    } catch {
        return false;
    }
};

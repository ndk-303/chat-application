import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuth } from './socketAuth';
import registerChatHandlers from './handlers/chatHandler';

let io: Server;

const userSocketMap = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.use(socketAuth);

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId as string;
        console.log(`[Socket] User ${userId} connected — socket ${socket.id}`);

        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)!.add(socket.id);

        registerChatHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} disconnected — socket ${socket.id}`);
            const sockets = userSocketMap.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSocketMap.delete(userId);
                }
            }
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

export const getUserSockets = (userId: string): string[] => {
    const sockets = userSocketMap.get(userId);
    return sockets ? Array.from(sockets) : [];
};

export const emitToUser = (userId: string, event: string, data: any): void => {
    const socketIds = getUserSockets(userId);
    socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data);
    });
};

export const isUserOnline = (userId: string): boolean => {
    return userSocketMap.has(userId);
};

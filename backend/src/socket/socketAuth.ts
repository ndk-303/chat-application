import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const socketAuth = (socket: Socket, next: (err?: Error) => void): void => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, secret) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
};

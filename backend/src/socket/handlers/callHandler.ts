import { Server, Socket } from 'socket.io';

type GetUserSocketsFn = (userId: string) => Promise<string[]>;

const registerCallHandlers = (
    io: Server,
    socket: Socket,
    getUserSockets: GetUserSocketsFn
): void => {
    const callerId = socket.data.userId as string;

    const emitToUser = async (userId: string, event: string, data: any) => {
        const sockets = await getUserSockets(userId);
        for (const socketId of sockets) {
            io.to(socketId).emit(event, data);
        }
    };

    socket.on('call:offer', async (data: {
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
        callerInfo: { _id: string; displayName: string; avatar?: string };
    }) => {
        const { targetUserId, offer, callType, callerInfo } = data;
        console.log(`[Call] ${callerId} → offer to ${targetUserId} (${callType})`);
        await emitToUser(targetUserId, 'call:incoming', { callerId, callerInfo, offer, callType });
    });

    socket.on('call:answer', async (data: {
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        const { targetUserId, answer } = data;
        console.log(`[Call] ${callerId} → answer to ${targetUserId}`);
        await emitToUser(targetUserId, 'call:answered', { answererId: callerId, answer });
    });

    socket.on('call:ice-candidate', async (data: {
        targetUserId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        const { targetUserId, candidate } = data;
        await emitToUser(targetUserId, 'call:ice-candidate', { senderId: callerId, candidate });
    });

    socket.on('call:reject', async (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} rejected call from ${targetUserId}`);
        await emitToUser(targetUserId, 'call:rejected', { rejectedBy: callerId });
    });

    socket.on('call:end', async (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} ended call with ${targetUserId}`);
        await emitToUser(targetUserId, 'call:ended', { endedBy: callerId });
    });
};

export default registerCallHandlers;

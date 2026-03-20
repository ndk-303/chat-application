import { Server, Socket } from 'socket.io';

const registerCallHandlers = (
    io: Server,
    socket: Socket,
    userSocketMap: Map<string, Set<string>>
): void => {
    const callerId = socket.data.userId as string;

    const emitToUser = (userId: string, event: string, data: any) => {
        const sockets = userSocketMap.get(userId);
        if (!sockets) return;
        for (const socketId of sockets) {
            io.to(socketId).emit(event, data);
        }
    };

    socket.on('call:offer', (data: {
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
        callerInfo: { _id: string; displayName: string; avatar?: string };
    }) => {
        const { targetUserId, offer, callType, callerInfo } = data;
        console.log(`[Call] ${callerId} → offer to ${targetUserId} (${callType})`);

        emitToUser(targetUserId, 'call:incoming', {
            callerId,
            callerInfo,
            offer,
            callType,
        });
    });

    socket.on('call:answer', (data: {
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        const { targetUserId, answer } = data;
        console.log(`[Call] ${callerId} → answer to ${targetUserId}`);

        emitToUser(targetUserId, 'call:answered', {
            answererId: callerId,
            answer,
        });
    });

    socket.on('call:ice-candidate', (data: {
        targetUserId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        const { targetUserId, candidate } = data;
        emitToUser(targetUserId, 'call:ice-candidate', {
            senderId: callerId,
            candidate,
        });
    });

    socket.on('call:reject', (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} rejected call from ${targetUserId}`);

        emitToUser(targetUserId, 'call:rejected', {
            rejectedBy: callerId,
        });
    });

    socket.on('call:end', (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} ended call with ${targetUserId}`);

        emitToUser(targetUserId, 'call:ended', {
            endedBy: callerId,
        });
    });
};

export default registerCallHandlers;

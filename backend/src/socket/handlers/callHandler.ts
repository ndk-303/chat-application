import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';
import MessageModel from '../../models/Message';
import mongoose from 'mongoose';
import { redisClient } from '../../config/redis';

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

    /** Find the private conversation between two users */
    const findPrivateConversation = async (userA: string, userB: string) => {
        return ConversationModel.findOne({
            type: 'private',
            participants: {
                $all: [
                    new mongoose.Types.ObjectId(userA),
                    new mongoose.Types.ObjectId(userB),
                ],
                $size: 2,
            },
        });
    };

    /** Create a call summary message and emit new_message to the conversation room */
    const createCallMessage = async (
        conversationId: mongoose.Types.ObjectId,
        senderId: string,
        callType: 'audio' | 'video',
        callStatus: 'ended' | 'missed' | 'rejected',
        callDuration: number,
    ) => {
        const label =
            callStatus === 'ended'
                ? callType === 'video' ? 'Cuộc gọi video đã kết thúc' : 'Cuộc gọi thoại đã kết thúc'
                : callStatus === 'missed'
                ? callType === 'video' ? 'Cuộc gọi video nhỡ' : 'Cuộc gọi nhỡ'
                : callType === 'video' ? 'Cuộc gọi video bị từ chối' : 'Cuộc gọi bị từ chối';

        const message = await (MessageModel.create as any)({
            conversationId,
            senderId: new mongoose.Types.ObjectId(senderId),
            content: label,
            type: 'call' as const,
            status: 'sent',
            callMeta: { callType, callDuration, callStatus },
        }) as InstanceType<typeof MessageModel>;

        await message.populate('senderId', 'displayName email avatar');

        // Update conversation's last message
        await ConversationModel.findByIdAndUpdate(conversationId, {
            lastMessageId: message._id,
            lastMessageAt: (message as any).createdAt,
        });

        // Broadcast to all participants in the conversation room
        io.to(conversationId.toString()).emit('new_message', message);

        return message;
    };

    // ── Track call state in Redis for multi-node support ───────────────────
    const getCallKey = (u1: string, u2: string) => `call_state:${[u1, u2].sort().join('_')}`;

    socket.on('call:offer', async (data: {
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
        callerInfo: { _id: string; displayName: string; avatar?: string };
    }) => {
        const { targetUserId, offer, callType, callerInfo } = data;
        console.log(`[Call] ${callerId} → offer to ${targetUserId} (${callType})`);
        
        const key = getCallKey(callerId, targetUserId);
        await redisClient.hset(key, {
            status: 'calling',
            offerTime: Date.now(),
            callerId: callerId,
            callType: callType
        });
        await redisClient.expire(key, 3600); // Tự dọn dẹp sau 1h tránh rác

        await emitToUser(targetUserId, 'call:incoming', { callerId, callerInfo, offer, callType });
    });

    socket.on('call:answer', async (data: {
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        const { targetUserId, answer } = data;
        console.log(`[Call] ${callerId} → answer to ${targetUserId}`);
        
        const key = getCallKey(callerId, targetUserId);
        await redisClient.hset(key, {
            status: 'connected',
            answerTime: Date.now()
        });

        await emitToUser(targetUserId, 'call:answered', { answererId: callerId, answer });
    });

    socket.on('call:ice-candidate', async (data: {
        targetUserId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        const { targetUserId, candidate } = data;
        await emitToUser(targetUserId, 'call:ice-candidate', { senderId: callerId, candidate });
    });

    socket.on('call:reject', async (data: { targetUserId: string; callType?: 'audio' | 'video' }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} rejected call from ${targetUserId}`);
        
        const key = getCallKey(callerId, targetUserId);
        const callData = await redisClient.hgetall(key);
        await redisClient.del(key);
        
        const cType = (callData?.callType as 'audio' | 'video') || data.callType || 'audio';
        const originalCallerId = callData?.callerId || targetUserId;

        await emitToUser(targetUserId, 'call:rejected', { rejectedBy: callerId });

        try {
            const conv = await findPrivateConversation(callerId, targetUserId);
            if (conv) {
                await createCallMessage(
                    conv._id as mongoose.Types.ObjectId,
                    originalCallerId, // người khởi tạo cuộc gọi luôn là senderId
                    cType,
                    'rejected',
                    0,
                );
            }
        } catch (err) {
            console.error('[Call] Failed to create reject message', err);
        }
    });

    socket.on('call:end', async (data: { targetUserId: string; callType?: 'audio' | 'video' }) => {
        const { targetUserId } = data;
        console.log(`[Call] ${callerId} ended call with ${targetUserId}`);

        const key = getCallKey(callerId, targetUserId);
        const callData = await redisClient.hgetall(key);
        await redisClient.del(key);

        let finalStatus: 'ended' | 'missed' = 'ended';
        let durationSeconds = 0;
        
        // Use saved state or fallback arguments
        const cType = (callData?.callType as 'audio' | 'video') || data.callType || 'audio';
        const originalCallerId = callData?.callerId || callerId;

        if (callData && Object.keys(callData).length > 0) {
            if (callData.status === 'calling') {
                finalStatus = 'missed';
            } else if (callData.status === 'connected') {
                const answerTime = Number(callData.answerTime);
                durationSeconds = Math.floor((Date.now() - answerTime) / 1000);
            }
        } else {
            // No state found (e.g., redis cleared or race condition), treat as ended with 0s
            finalStatus = 'ended'; 
        }

        await emitToUser(targetUserId, 'call:ended', { endedBy: callerId });

        try {
            const conv = await findPrivateConversation(callerId, targetUserId);
            if (conv) {
                await createCallMessage(
                    conv._id as mongoose.Types.ObjectId,
                    originalCallerId,
                    cType,
                    finalStatus,
                    durationSeconds,
                );
            }

        } catch (err) {
            console.error('[Call] Failed to create end message', err);
        }
    });
};

export default registerCallHandlers;

import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';
import MessageModel from '../../models/Message';
import mongoose from 'mongoose';

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

    // ── Track call start times (keyed by callerId-targetUserId) ────────────────
    const callStartTimes = new Map<string, number>();

    socket.on('call:offer', async (data: {
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
        callerInfo: { _id: string; displayName: string; avatar?: string };
    }) => {
        const { targetUserId, offer, callType, callerInfo } = data;
        console.log(`[Call] ${callerId} → offer to ${targetUserId} (${callType})`);
        callStartTimes.set(`${callerId}-${targetUserId}`, Date.now());
        await emitToUser(targetUserId, 'call:incoming', { callerId, callerInfo, offer, callType });
    });

    socket.on('call:answer', async (data: {
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        const { targetUserId, answer } = data;
        console.log(`[Call] ${callerId} → answer to ${targetUserId}`);
        // Reset timer from when offer was sent to when answered (connected)
        callStartTimes.set(`${targetUserId}-${callerId}`, Date.now());
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
        const { targetUserId, callType = 'audio' } = data;
        console.log(`[Call] ${callerId} rejected call from ${targetUserId}`);
        callStartTimes.delete(`${targetUserId}-${callerId}`);
        await emitToUser(targetUserId, 'call:rejected', { rejectedBy: callerId });

        try {
            const conv = await findPrivateConversation(callerId, targetUserId);
            if (conv) {
                await createCallMessage(
                    conv._id as mongoose.Types.ObjectId,
                    targetUserId, // caller is the sender of the call message
                    callType,
                    'rejected',
                    0,
                );
            }
        } catch (err) {
            console.error('[Call] Failed to create reject message', err);
        }
    });

    socket.on('call:end', async (data: { targetUserId: string; callType?: 'audio' | 'video' }) => {
        const { targetUserId, callType = 'audio' } = data;
        console.log(`[Call] ${callerId} ended call with ${targetUserId}`);

        // Calculate duration — try both key directions
        const key1 = `${callerId}-${targetUserId}`;
        const key2 = `${targetUserId}-${callerId}`;
        const startTime = callStartTimes.get(key1) ?? callStartTimes.get(key2);
        const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        callStartTimes.delete(key1);
        callStartTimes.delete(key2);

        await emitToUser(targetUserId, 'call:ended', { endedBy: callerId });

        try {
            const conv = await findPrivateConversation(callerId, targetUserId);
            if (conv) {
                await createCallMessage(
                    conv._id as mongoose.Types.ObjectId,
                    callerId,
                    callType,
                    'ended',
                    durationSeconds,
                );
            }
        } catch (err) {
            console.error('[Call] Failed to create end message', err);
        }
    });
};

export default registerCallHandlers;

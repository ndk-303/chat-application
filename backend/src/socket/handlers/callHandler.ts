import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';
import MessageModel from '../../models/Message';
import UserModel from '../../models/User';
import mongoose from 'mongoose';
import { redisClient } from '../../config/redis';

type GetUserSocketsFn = (userId: string) => Promise<string[]>;

// ── Key helpers ────────────────────────────────────────────────────────────────
const getCallKey = (u1: string, u2: string) => `call_state:${[u1, u2].sort().join('_')}`;

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

/**
 * Create a call summary message and emit new_message to the conversation room.
 * Uses new MessageModel().save() for full TypeScript type safety (T-019).
 */
const createCallMessage = async (
    io: Server,
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

    // T-019: use new + save() instead of (create as any) cast
    const message = new MessageModel({
        conversationId,
        senderId: new mongoose.Types.ObjectId(senderId),
        content: label,
        type: 'call' as const,
        status: 'sent',
        callMeta: { callType, callDuration, callStatus },
    });
    await message.save();
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

/**
 * T-010: On server startup, scan for stale `call_state:*` keys whose TTL indicates
 * they were left behind by a server crash or both-party network drop, and write
 * a missed-call record to the DB so conversation history is complete.
 *
 * This is called once at startup from initSocket().
 */
export const cleanupStaleCallStates = async (io: Server): Promise<void> => {
    try {
        const keys = await redisClient.keys('call_state:*');
        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            // A key with TTL < 3500s has been sitting for at least 100s — treat as stale.
            // (New keys have TTL ~3600s; anything below threshold was orphaned.)
            if (ttl < 3500) {
                const callData = await redisClient.hgetall(key);
                await redisClient.del(key);

                if (!callData || !callData.callerId) continue;

                // Derive the two user IDs from the key: call_state:uid1_uid2
                const parts = key.replace('call_state:', '').split('_');
                if (parts.length < 2) continue;
                const [u1, u2] = parts;
                const otherUserId = callData.callerId === u1 ? u2 : u1;

                const cType = (callData.callType as 'audio' | 'video') || 'audio';

                try {
                    const conv = await findPrivateConversation(callData.callerId, otherUserId);
                    if (conv) {
                        await createCallMessage(
                            io,
                            conv._id as mongoose.Types.ObjectId,
                            callData.callerId,
                            cType,
                            'missed',
                            0,
                        );
                        console.log(`[Call] Wrote missed-call record for stale key ${key}`);
                    }
                } catch (err) {
                    console.error(`[Call] Failed to write missed-call record for ${key}:`, err);
                }
            }
        }
    } catch (err) {
        console.error('[Call] Stale call-state cleanup failed:', err);
    }
};

// ── Per-socket error wrapper (T-020) ──────────────────────────────────────────
const withErrorBoundary = (
    socket: Socket,
    eventName: string,
    fn: (...args: any[]) => Promise<void>
) => (...args: any[]) =>
    fn(...args).catch(err => {
        console.error(`[Call] Unhandled error in '${eventName}':`, err);
        socket.emit('call:error', { event: eventName, message: 'Internal server error' });
    });

// ─────────────────────────────────────────────────────────────────────────────

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

    // ── call:offer ────────────────────────────────────────────────────────────
    // T-013: fetch callerInfo server-side — never trust the client-supplied identity.
    socket.on('call:offer', withErrorBoundary(socket, 'call:offer', async (data: {
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
        // callerInfo from client is intentionally ignored; we fetch it from DB.
    }) => {
        const { targetUserId, offer, callType } = data;

        // Fetch real caller identity from the database (T-013)
        const callerInfo = await UserModel.findById(callerId)
            .select('_id displayName avatar')
            .lean();

        const key = getCallKey(callerId, targetUserId);
        await redisClient.hset(key, {
            status: 'calling',
            offerTime: Date.now(),
            callerId: callerId,
            callType: callType,
        });
        await redisClient.expire(key, 3600);

        await emitToUser(targetUserId, 'call:incoming', { callerId, callerInfo, offer, callType });
    }));

    // ── call:answer ───────────────────────────────────────────────────────────
    socket.on('call:answer', withErrorBoundary(socket, 'call:answer', async (data: {
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        const { targetUserId, answer } = data;

        const key = getCallKey(callerId, targetUserId);
        await redisClient.hset(key, {
            status: 'connected',
            answerTime: Date.now(),
        });

        await emitToUser(targetUserId, 'call:answered', { answererId: callerId, answer });
    }));

    // ── call:ice-candidate ────────────────────────────────────────────────────
    socket.on('call:ice-candidate', withErrorBoundary(socket, 'call:ice-candidate', async (data: {
        targetUserId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        const { targetUserId, candidate } = data;
        await emitToUser(targetUserId, 'call:ice-candidate', { senderId: callerId, candidate });
    }));

    // ── call:reject ───────────────────────────────────────────────────────────
    // T-027: verify the authenticated user is a participant before deleting state.
    socket.on('call:reject', withErrorBoundary(socket, 'call:reject', async (data: {
        targetUserId: string;
        callType?: 'audio' | 'video';
    }) => {
        const { targetUserId } = data;

        const key = getCallKey(callerId, targetUserId);
        const callData = await redisClient.hgetall(key);

        // T-027: only the actual caller or callee may mutate call state
        if (callData && callData.callerId) {
            const isParticipant =
                callData.callerId === callerId || callData.callerId === targetUserId;
            if (!isParticipant) {
                console.warn(`[Call] call:reject — ${callerId} is not a participant of ${key}`);
                return;
            }
        }

        await redisClient.del(key);

        const cType = (callData?.callType as 'audio' | 'video') || data.callType || 'audio';
        const originalCallerId = callData?.callerId || targetUserId;

        await emitToUser(targetUserId, 'call:rejected', { rejectedBy: callerId });

        try {
            const conv = await findPrivateConversation(callerId, targetUserId);
            if (conv) {
                await createCallMessage(
                    io,
                    conv._id as mongoose.Types.ObjectId,
                    originalCallerId,
                    cType,
                    'rejected',
                    0,
                );
            }
        } catch (err) {
            console.error('[Call] Failed to create reject message', err);
        }
    }));

    // ── call:end ──────────────────────────────────────────────────────────────
    socket.on('call:end', withErrorBoundary(socket, 'call:end', async (data: {
        targetUserId: string;
        callType?: 'audio' | 'video';
    }) => {
        const { targetUserId } = data;

        const key = getCallKey(callerId, targetUserId);
        const callData = await redisClient.hgetall(key);
        await redisClient.del(key);

        let finalStatus: 'ended' | 'missed' = 'ended';
        let durationSeconds = 0;

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
                    io,
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
    }));
};

export default registerCallHandlers;

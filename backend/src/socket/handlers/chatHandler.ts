import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';
import { markConversationDelivered, markConversationSeen, markMessageSeen } from '../../services/messageService';
import { redisClient } from '../../config/redis';

// ── Per-socket event rate limiter (T-014) ──────────────────────────────────────
/**
 * Check whether the authenticated user has exceeded `maxRequests` for `event`
 * within `windowMs` milliseconds. Uses Redis INCR + PEXPIRE for atomic counting.
 * Returns true if the request is allowed, false if it should be dropped.
 */
const checkSocketRateLimit = async (
    userId: string,
    event: string,
    maxRequests: number,
    windowMs: number
): Promise<boolean> => {
    const key = `socket_rl:${userId}:${event}`;
    try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.pexpire(key, windowMs);
        return count <= maxRequests;
    } catch {
        // Redis unavailable — fail open (don't drop the request)
        return true;
    }
};

const registerChatHandlers = (io: Server, socket: Socket): void => {
    const userId = socket.data.userId as string;

    socket.on('join_conversation', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation) return;

            const isParticipant = conversation.participants.some(
                (p: any) => p.toString() === userId
            );

            if (!isParticipant) {
                socket.emit('error', { message: 'You are not a participant in this conversation' });
                return;
            }

            const alreadyInRoom = socket.rooms.has(conversationId);
            socket.join(conversationId);
            console.log(`[Socket] User ${userId} joined conversation ${conversationId}`);

            // T-039: Only trigger bulk status transitions on fresh room entry, not duplicate events/tabs
            if (!alreadyInRoom) {
                // Mark all unread messages as seen (fixes unread badge persisting after reload)
                await markConversationSeen(conversationId, userId);

                // Mark all 'sent' messages from others as 'delivered'
                const deliveredIds = await markConversationDelivered(conversationId, userId);
                if (deliveredIds.length > 0) {
                    io.to(conversationId).emit('messages_delivered', {
                        conversationId,
                        messageIds: deliveredIds,
                    });
                }
            }
        } catch (err) {
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
        const { conversationId } = data;
        socket.leave(conversationId);
        console.log(`[Socket] User ${userId} left conversation ${conversationId}`);
    });

    // T-028: mark_seen — only process if the user has joined the conversation room
    socket.on('mark_seen', async (data: { conversationId: string; messageId: string }) => {
        const { conversationId, messageId } = data;

        // Verify the socket has actually joined this conversation's room
        if (!socket.rooms.has(conversationId)) {
            return; // silently drop — user hasn't joined this room
        }

        try {
            await markMessageSeen(messageId, userId);
            // markMessageSeen already emits 'message_seen' to the room via getIO()
        } catch (err) {
            console.error('[Socket] mark_seen error:', err);
        }
    });

    // T-029 + T-014: typing events — membership check + rate limiting
    // Rate limit: max 3 typing events per 2 seconds per user (prevents flooding)
    socket.on('typing_start', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        // T-029: only emit if the user is in the room (joined via join_conversation)
        if (!socket.rooms.has(conversationId)) return;

        // T-014: rate limit typing events
        const allowed = await checkSocketRateLimit(userId, 'typing', 3, 2000);
        if (!allowed) return;

        socket.to(conversationId).emit('typing', {
            userId,
            conversationId,
            isTyping: true,
        });
    });

    socket.on('typing_stop', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        // T-029: only emit if the user is in the room
        if (!socket.rooms.has(conversationId)) return;

        socket.to(conversationId).emit('typing', {
            userId,
            conversationId,
            isTyping: false,
        });
    });
};

export default registerChatHandlers;
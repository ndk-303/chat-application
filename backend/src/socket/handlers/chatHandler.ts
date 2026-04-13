import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';
import { markConversationDelivered, markConversationSeen, markMessageSeen } from '../../services/messageService';

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

            socket.join(conversationId);
            console.log(`[Socket] User ${userId} joined conversation ${conversationId}`);

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
        } catch (err) {
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
        const { conversationId } = data;
        socket.leave(conversationId);
        console.log(`[Socket] User ${userId} left conversation ${conversationId}`);
    });

    // Client emits this when the user reads messages in a conversation
    socket.on('mark_seen', async (data: { conversationId: string; messageId: string }) => {
        const { conversationId, messageId } = data;
        try {
            await markMessageSeen(messageId, userId);
            // markMessageSeen already emits 'message_seen' to the room via getIO()
        } catch (err) {
            console.error('[Socket] mark_seen error:', err);
        }
    });

    socket.on('typing_start', (data: { conversationId: string }) => {
        const { conversationId } = data;
        socket.to(conversationId).emit('typing', {
            userId,
            conversationId,
            isTyping: true
        });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
        const { conversationId } = data;
        socket.to(conversationId).emit('typing', {
            userId,
            conversationId,
            isTyping: false
        });
    });
};

export default registerChatHandlers;
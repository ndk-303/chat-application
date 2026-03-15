import { Server, Socket } from 'socket.io';
import ConversationModel from '../../models/Conversation';

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
        } catch (err) {
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
        const { conversationId } = data;
        socket.leave(conversationId);
        console.log(`[Socket] User ${userId} left conversation ${conversationId}`);
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

export default registerChatHandlers
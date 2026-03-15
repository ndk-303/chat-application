import MessageModel from '../models/Message';
import ConversationModel from '../models/Conversation';
import mongoose from 'mongoose';
import { getIO } from '../socket/socketManager';

export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
    }

    const query: any = { conversationId };

    if (before) {
        const beforeMessage = await MessageModel.findById(before);
        if (beforeMessage) {
            query.createdAt = { $lt: beforeMessage.createdAt };
        }
    }

    const messages = await MessageModel.find(query)
        .populate('senderId', 'displayName email avatar')
        .sort({ createdAt: -1 })
        .limit(limit);

    return messages.reverse();
};

export const createMessage = async (
    conversationId: string,
    senderId: string,
    content: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === senderId
    );

    if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
    }

    if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
    }

    const message = await MessageModel.create({
        conversationId,
        senderId,
        content: content.trim(),
        status: 'sent'
    });

    conversation.lastMessageId = message._id as mongoose.Types.ObjectId;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    await message.populate('senderId', 'displayName email avatar');

    try {
        getIO().to(conversationId).emit('new_message', message);
    } catch (_) { }

    return message;
};

export const markMessageSeen = async (messageId: string, userId: string) => {
    const message = await MessageModel.findById(messageId);

    if (!message) {
        throw new Error('Message not found');
    }

    const conversation = await ConversationModel.findById(message.conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
    }

    if (message.senderId.toString() === userId) {
        return message;
    }
    const alreadySeen = message.seenBy.some(
        (user: any) => user.userId.toString() === userId
    );

    if (!alreadySeen) {
        const seenAt = new Date();
        message.seenBy.push({
            userId: new mongoose.Types.ObjectId(userId),
            seenAt
        });

        const allSeen = conversation.participants.every((p: any) => {
            const pId = p.toString();
            return pId === message.senderId.toString() ||
                message.seenBy.some((user: any) => user.userId.toString() === pId);
        });

        if (allSeen) {
            message.status = 'seen';
        }

        await message.save();

        try {
            getIO().to(message.conversationId.toString()).emit('message_seen', {
                messageId: message._id,
                userId,
                seenAt,
                status: message.status
            });
        } catch (_) { }
    }

    return message;
};

export const deleteUserMessage = async (messageId: string, userId: string) => {
    const message = await MessageModel.findById(messageId);

    if (!message) {
        throw new Error('Message not found');
    }

    if (message.senderId.toString() !== userId) {
        throw new Error('You can only delete your own messages');
    }

    await MessageModel.deleteOne({ _id: messageId });

    const conversation = await ConversationModel.findById(message.conversationId);
    if (conversation && conversation.lastMessageId?.toString() === messageId) {
        const lastMessage = await MessageModel.findOne({
            conversationId: message.conversationId
        }).sort({ createdAt: -1 });

        if (lastMessage) {
            conversation.lastMessageId = lastMessage._id as mongoose.Types.ObjectId;
            conversation.lastMessageAt = lastMessage.createdAt;
        } else {
            conversation.lastMessageId = undefined;
            conversation.lastMessageAt = undefined;
        }
        await conversation.save();
    }

    try {
        getIO().to(message.conversationId.toString()).emit('message_deleted', {
            messageId,
            conversationId: message.conversationId.toString()
        });
    } catch (_) { }

    return { message: 'Message deleted successfully' };
};

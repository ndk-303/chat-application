import MessageModel from '../models/Message';
import ConversationModel from '../models/Conversation';
import mongoose from 'mongoose';
import { getIO, emitToUser } from '../socket/socketManager';
import { errorUtil } from '../utils/errorUtils';

export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);
    }

    const query: any = { conversationId };

    // If user has hidden this conversation, only show messages after hiddenAt
    const hiddenEntry = (conversation.hiddenFor || []).find(
        (h: any) => h.userId.toString() === userId
    );
    if (hiddenEntry) {
        query.createdAt = { ...(query.createdAt || {}), $gt: hiddenEntry.hiddenAt };
    }

    if (before) {
        const beforeMessage = await MessageModel.findById(before);
        if (beforeMessage) {
            query.createdAt = { ...(query.createdAt || {}), $lt: beforeMessage.createdAt };
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
    content: string,
    files: { url: string; publicId: string; originalName: string; size: number; mimeType: string; type: 'image' | 'video' | 'raw' }[]
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === senderId
    );

    if (!isParticipant) {
        throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);
    }

    if ((!content || content.trim().length === 0) && (!files || files.length === 0)) {
        throw new errorUtil('Nội dung tin nhắn không được để trống', 400);
    }

    const message = await MessageModel.create({
        conversationId,
        senderId,
        content: content.trim(),
        files: files || [],
        status: 'sent',
    });

    // T-035: Check if first message before updating lastMessageId (avoids expensive countDocuments)
    const isFirstMessage = !conversation.lastMessageId;

    // T-023: Atomically update conversation's lastMessageId and lastMessageAt
    await ConversationModel.findByIdAndUpdate(conversationId, {
        $set: {
            lastMessageId: message._id,
            lastMessageAt: message.createdAt
        }
    });

    await message.populate('senderId', 'displayName email avatar');

    try {
        const io = getIO();
        io.to(conversationId).emit('new_message', message);

        // Nếu đây là tin nhắn ĐẦU TIÊN trong private conversation,
        // emit private_conversation_created để người nhận thấy conversation mới trong sidebar
        if (isFirstMessage && conversation.type === 'private') {
            const populatedConv = await ConversationModel.findById(conversationId)
                .populate('participants', 'displayName email avatar status lastSeen')
                .populate('lastMessageId');
            if (populatedConv) {
                for (const participantId of conversation.participants) {
                    const pId = participantId.toString();
                    if (pId !== senderId) {
                        await emitToUser(pId, 'private_conversation_created', populatedConv);
                    }
                }
            }
        }

        // Emit conversation_updated cho participants không ở trong socket room
        for (const participantId of conversation.participants) {
            const pId = participantId.toString();
            if (pId === senderId) continue;
            await emitToUser(pId, 'conversation_updated', {
                conversationId,
                lastMessage: message,
                lastMessageAt: message.createdAt,
            });
        }
    } catch (_) { }

    return message;
};

export const markMessageSeen = async (messageId: string, userId: string) => {
    const message = await MessageModel.findById(messageId);

    if (!message) {
        throw new errorUtil('Không tìm thấy tin nhắn', 400);
    }

    const conversation = await ConversationModel.findById(message.conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);
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

export const markConversationDelivered = async (
    conversationId: string,
    userId: string
): Promise<string[]> => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Step 1: identify the exact messages to mark (status='sent', not from this user).
    // Capturing IDs first ensures the returned list contains only the messages
    // we actually transition — not a broader "all delivered" set (which could include
    // messages already delivered before this call).
    const toDeliver = await MessageModel.find(
        {
            conversationId,
            senderId: { $ne: userObjectId },
            status: 'sent',
        },
        '_id'
    ).lean();

    if (toDeliver.length === 0) return [];

    const ids = toDeliver.map((m: any) => m._id as mongoose.Types.ObjectId);

    // Step 2: bulk-update only the targeted IDs.
    await MessageModel.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'delivered' } }
    );

    return ids.map(id => id.toString());
};


/**
 * Mark ALL unread messages in a conversation as seen by userId.
 * Called when user opens/joins a conversation so unreadCount resets after reload.
 */
export const markConversationSeen = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const seenAt = new Date();

    const result = await MessageModel.updateMany(
        {
            conversationId,
            senderId: { $ne: userObjectId },
            'seenBy.userId': { $ne: userObjectId },
        },
        {
            $push: { seenBy: { userId: userObjectId, seenAt } },
            $set: { status: 'seen' },
        }
    );

    // T-034: Emit real-time read receipt to conversation room
    if (result.modifiedCount > 0) {
        try {
            getIO().to(conversationId).emit('conversation_seen', {
                conversationId,
                userId,
                seenAt,
            });
        } catch (_) { }
    }
};

export const deleteUserMessage = async (messageId: string, userId: string) => {
    const message = await MessageModel.findById(messageId);

    if (!message) {
        throw new errorUtil('Không tìm thấy tin nhắn', 400);
    }

    if (message.senderId.toString() !== userId) {
        throw new errorUtil('Bạn chỉ có thể xóa tin nhắn của chính mình', 400);
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

    return { message: 'Xóa tin nhắn thành công' };
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new errorUtil('Không tìm thấy tin nhắn', 400);

    const conversation = await ConversationModel.findById(message.conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );
    if (!isParticipant) throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // T-024 / T-036: Atomic reaction toggle using MongoDB operators to avoid race conditions.
    // Check if user already reacted with this exact emoji
    const existingSameReaction = message.reactions.find(
        (r: any) => r.emoji === emoji && r.userIds.some((uid: any) => uid.toString() === userId)
    );

    if (existingSameReaction) {
        // User clicked the same emoji again -> remove (toggle off)
        await MessageModel.updateOne(
            { _id: messageId, 'reactions.emoji': emoji },
            { $pull: { 'reactions.$.userIds': userObjectId } }
        );
    } else {
        // Remove user from any other emoji (single reaction per user policy)
        await MessageModel.updateOne(
            { _id: messageId },
            { $pull: { 'reactions.$[].userIds': userObjectId } }
        );

        // Try to add user to existing group with this emoji
        const updateResult = await MessageModel.updateOne(
            { _id: messageId, 'reactions.emoji': emoji },
            { $addToSet: { 'reactions.$.userIds': userObjectId } }
        );

        // If no group for this emoji existed, create a new one
        if (updateResult.matchedCount === 0) {
            await MessageModel.updateOne(
                { _id: messageId },
                { $push: { reactions: { emoji, userIds: [userObjectId] } } }
            );
        }
    }

    // Clean up empty reaction groups (userIds length == 0)
    await MessageModel.updateOne(
        { _id: messageId },
        { $pull: { reactions: { userIds: { $size: 0 } } } }
    );

    const updated = await MessageModel.findById(messageId).select('reactions conversationId');
    const serializedReactions = (updated?.reactions || []).map((r: any) => ({
        emoji: r.emoji,
        userIds: r.userIds.map((uid: any) => uid.toString()),
    }));

    try {
        getIO()
            .to(message.conversationId.toString())
            .emit('message_reaction_updated', {
                messageId: message._id.toString(),
                conversationId: message.conversationId.toString(),
                reactions: serializedReactions,
            });
    } catch (_) { }

    return serializedReactions;
};

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

    conversation.lastMessageId = message._id as mongoose.Types.ObjectId;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    await message.populate('senderId', 'displayName email avatar');

    try {
        const io = getIO();
        io.to(conversationId).emit('new_message', message);

        // Nếu đây là tin nhắn ĐẦU TIÊN trong private conversation,
        // emit private_conversation_created để người nhận thấy conversation mới trong sidebar
        const isFirstMessage = (await MessageModel.countDocuments({ conversationId })) === 1;
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
        // (người chưa mở conversation — sidebar cần cập nhật last message)
        const room = io.sockets.adapter.rooms.get(conversationId);
        const socketsInRoom = room ? Array.from(room) : [];

        for (const participantId of conversation.participants) {
            const pId = participantId.toString();
            if (pId === senderId) continue; // người gửi tự xử lý
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
    const result = await MessageModel.updateMany(
        {
            conversationId,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            status: 'sent',
        },
        { $set: { status: 'delivered' } }
    );

    if (result.modifiedCount === 0) return [];

    // Return the IDs of messages that were just updated
    const updated = await MessageModel.find(
        {
            conversationId,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            status: 'delivered',
        },
        '_id'
    ).lean();

    return updated.map((m: any) => m._id.toString());
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

    // ── Step 1: Remove user from any OTHER emoji group (one reaction per user) ──
    // Rebuild as plain objects to avoid Mongoose subdocument mutation tracking issues
    const cleanedReactions: { emoji: string; userIds: mongoose.Types.ObjectId[] }[] = message.reactions
        .map((r: any) => ({
            emoji: r.emoji,
            userIds: r.emoji !== emoji
                ? r.userIds.filter((uid: any) => uid.toString() !== userId)
                : [...r.userIds],
        }))
        .filter((r) => r.userIds.length > 0);

    // ── Step 2: Toggle the selected emoji ────────────────────────────────────────
    const existingGroup = cleanedReactions.find((r) => r.emoji === emoji);

    if (existingGroup) {
        const alreadyReacted = existingGroup.userIds.some(
            (uid: any) => uid.toString() === userId
        );
        if (alreadyReacted) {
            // Toggle OFF — remove userId
            existingGroup.userIds = existingGroup.userIds.filter(
                (uid: any) => uid.toString() !== userId
            );
        }
        // else: already added in step 1 cleanup, do nothing (already in group)
    } else {
        // Add new emoji group
        cleanedReactions.push({ emoji, userIds: [userObjectId] });
    }

    // Remove groups with 0 users after toggle-off
    message.reactions = cleanedReactions.filter((r) => r.userIds.length > 0) as any;
    message.markModified('reactions');

    await message.save();


    // Serialize reactions for frontend: [{ emoji, userIds: string[] }]
    const serializedReactions = message.reactions.map((r: any) => ({
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

import ConversationModel from '../models/Conversation';
import MessageModel from '../models/Message';
import FriendshipModel from '../models/Friendship';
import mongoose from 'mongoose';
import { getIO, emitToUser } from '../socket/socketManager';

export const getUserConversations = async (userId: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await ConversationModel.find({
        participants: userId
    })
        .populate('participants', 'displayName email avatar status lastSeen')
        .populate('adminId', 'displayName email')
        .populate('lastMessageId')
        .sort({ lastMessageAt: -1 });

    const visible = conversations.filter((conv) => {
        const entry = conv.hiddenFor?.find(
            (h: any) => h.userId.toString() === userId
        );
        if (!entry) return true;
        return conv.lastMessageAt && conv.lastMessageAt > entry.hiddenAt;
    });

    // Compute unreadCount for each visible conversation via aggregation
    const conversationIds = visible.map((c) => c._id);
    const unreadAgg = await MessageModel.aggregate([
        {
            $match: {
                conversationId: { $in: conversationIds },
                senderId: { $ne: userObjectId },
                'seenBy.userId': { $ne: userObjectId },
            }
        },
        {
            $group: {
                _id: '$conversationId',
                count: { $sum: 1 }
            }
        }
    ]);

    // Build a map: conversationId → unreadCount
    const unreadMap: Record<string, number> = {};
    for (const row of unreadAgg) {
        unreadMap[row._id.toString()] = row.count;
    }

    // Attach unreadCount to each conversation (as a plain object)
    return visible.map((conv) => {
        const obj = conv.toObject() as any;
        obj.unreadCount = unreadMap[conv._id.toString()] ?? 0;
        return obj;
    });
};


export const getConversationById = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId)
        .populate('participants', 'displayName email avatar status lastSeen')
        .populate('adminId', 'displayName email')
        .populate('lastMessageId');

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
    }

    return conversation;
};

export const createPrivateConversation = async (userId: string, targetUserId: string) => {
    if (userId === targetUserId) {
        throw new Error('Cannot create conversation with yourself');
    }

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new Error('Can only create conversations with friends');
    }

    const existingConversation = await ConversationModel.findOne({
        type: 'private',
        participants: { $all: [userId, targetUserId], $size: 2 }
    });

    if (existingConversation) {
        return existingConversation;
    }

    const conversation = await ConversationModel.create({
        type: 'private',
        participants: [userId, targetUserId]
    });

    await conversation.populate('participants', 'displayName email avatar status lastSeen');

    return conversation;
};

export const createGroupConversation = async (
    userId: string,
    name: string,
    participantIds: string[],
    avatar?: string
) => {
    if (!name || name.trim().length === 0) {
        throw new Error('Group name is required');
    }

    if (participantIds.length < 2) {
        throw new Error('Group must have at least 2 members besides creator');
    }

    const allParticipants = [userId, ...participantIds.filter(id => id !== userId)];

    for (const participantId of participantIds) {
        if (participantId !== userId) {
            const friendship = await FriendshipModel.findOne({
                $or: [
                    { user1Id: userId, user2Id: participantId },
                    { user1Id: participantId, user2Id: userId }
                ]
            });

            if (!friendship) {
                throw new Error(`User ${participantId} is not your friend`);
            }
        }
    }

    const conversation = await ConversationModel.create({
        type: 'group',
        name: name.trim(),
        avatar: avatar ?? '',
        participants: allParticipants,
        adminId: userId
    });

    await conversation.populate('participants', 'displayName email avatar status lastSeen');
    await conversation.populate('adminId', 'displayName email');

    try {
        for (const participantId of participantIds) {
            if (participantId !== userId) {
                emitToUser(participantId, 'group_created', conversation);
            }
        }
    } catch (_) { }

    return conversation;
};

export const updateGroupDetails = async (
    conversationId: string,
    userId: string,
    updates: { name?: string; avatar?: string }
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.type !== 'group') {
        throw new Error('Can only update group conversations');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Only group admin can update group details');
    }

    if (updates.name !== undefined) {
        if (updates.name.trim().length === 0) {
            throw new Error('Group name cannot be empty');
        }
        conversation.name = updates.name.trim();
    }

    if (updates.avatar !== undefined) {
        conversation.avatar = updates.avatar;
    }

    await conversation.save();
    return conversation;
};

export const leaveConversation = async (conversationId: string, userId: string) => {
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

    if (conversation.type === 'private') {
        await ConversationModel.deleteOne({ _id: conversationId });
        await MessageModel.deleteMany({ conversationId });
        return { message: 'Conversation deleted successfully' };
    } else {
        conversation.participants = conversation.participants.filter(
            (p: any) => p.toString() !== userId
        );

        if (conversation.adminId?.toString() === userId && conversation.participants.length > 0) {
            conversation.adminId = conversation.participants[0] as mongoose.Types.ObjectId;
        }
        if (conversation.participants.length === 0) {
            await ConversationModel.deleteOne({ _id: conversationId });
            await MessageModel.deleteMany({ conversationId });
            return { message: 'Group deleted (no members left)' };
        }

        await conversation.save();

        try {
            // Get leaving user's name for system message
            const UserModel = (await import('../models/User')).default;
            const leavingUser = await UserModel.findById(userId).select('displayName');
            const displayName = leavingUser?.displayName || 'Ai đó';

            const systemMsg = await MessageModel.create({
                conversationId,
                senderId: userId,
                content: `${displayName} đã rời khỏi nhóm`,
                type: 'system',
                status: 'sent',
            });
            await systemMsg.populate('senderId', 'displayName email avatar');

            conversation.lastMessageId = systemMsg._id as mongoose.Types.ObjectId;
            conversation.lastMessageAt = systemMsg.createdAt;
            await conversation.save();

            getIO().to(conversationId).emit('new_message', systemMsg);
            getIO().to(conversationId).emit('member_left', { conversationId, userId, memberId: userId });
        } catch (_) { }

        return { message: 'Left group successfully' };
    }
};

export const addGroupMember = async (
    conversationId: string,
    userId: string,
    newMemberId: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.type !== 'group') {
        throw new Error('Can only add members to group conversations');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Only group admin can add members');
    }

    const isAlreadyMember = conversation.participants.some(
        (p: any) => p.toString() === newMemberId
    );

    if (isAlreadyMember) {
        throw new Error('User is already a member');
    }

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: newMemberId },
            { user1Id: newMemberId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new Error('Can only add friends to group');
    }

    conversation.participants.push(new mongoose.Types.ObjectId(newMemberId));
    await conversation.save();

    try {
        emitToUser(newMemberId, 'added_to_group', conversation);
        getIO().to(conversationId).emit('group_member_added', {
            conversationId,
            newMemberId
        });
    } catch (_) { }

    return conversation;
};

export const removeGroupMember = async (
    conversationId: string,
    userId: string,
    memberId: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.type !== 'group') {
        throw new Error('Can only remove members from group conversations');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Only group admin can remove members');
    }

    if (memberId === userId) {
        throw new Error('Admin cannot remove themselves, use leave instead');
    }

    const isMember = conversation.participants.some(
        (p: any) => p.toString() === memberId
    );

    if (!isMember) {
        throw new Error('User is not a member of this group');
    }

    conversation.participants = conversation.participants.filter(
        (p: any) => p.toString() !== memberId
    );

    await conversation.save();

    try {
        const UserModel = (await import('../models/User')).default;
        const [adminUser, kickedUser] = await Promise.all([
            UserModel.findById(userId).select('displayName'),
            UserModel.findById(memberId).select('displayName'),
        ]);
        const adminName = adminUser?.displayName || 'Admin';
        const kickedName = kickedUser?.displayName || 'Thành viên';

        const systemMsg = await MessageModel.create({
            conversationId,
            senderId: userId,
            content: `${adminName} đã xóa ${kickedName} khỏi nhóm`,
            type: 'system',
            status: 'sent',
        });
        await systemMsg.populate('senderId', 'displayName email avatar');

        conversation.lastMessageId = systemMsg._id as mongoose.Types.ObjectId;
        conversation.lastMessageAt = systemMsg.createdAt;
        await conversation.save();

        emitToUser(memberId, 'removed_from_group', { conversationId });
        getIO().to(conversationId).emit('new_message', systemMsg);
        getIO().to(conversationId).emit('group_member_removed', { conversationId, memberId });
    } catch (_) { }

    return conversation;
};

export const dissolveGroup = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.type !== 'group') {
        throw new Error('Can only dissolve group conversations');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Only group admin can dissolve the group');
    }

    const participantIds = conversation.participants.map((p: any) => p.toString());

    await ConversationModel.deleteOne({ _id: conversationId });
    await MessageModel.deleteMany({ conversationId });

    try {
        for (const participantId of participantIds) {
            emitToUser(participantId, 'group_dissolved', { conversationId });
        }
    } catch (_) { }

    return { message: 'Nhóm đã được giải tán' };
};

export const hideConversation = async (conversationId: string, userId: string) => {
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

    conversation.hiddenFor = (conversation.hiddenFor || []).filter(
        (h: any) => h.userId.toString() !== userId
    ) as any;

    (conversation.hiddenFor as any[]).push({ userId, hiddenAt: new Date() });

    await conversation.save();

    return { message: 'Đã xóa cuộc trò chuyện' };
};



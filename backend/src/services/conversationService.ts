import ConversationModel from '../models/Conversation';
import MessageModel from '../models/Message';
import FriendshipModel from '../models/Friendship';
import mongoose from 'mongoose';
import crypto from 'crypto';
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
        throw new Error('Bạn không phải thành viên của cuộc trò chuyện này');
    }

    return conversation;
};

export const createPrivateConversation = async (userId: string, targetUserId: string) => {
    if (userId === targetUserId) {
        throw new Error('Không thể tạo cuộc trò chuyện với chính mình');
    }

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new Error('Chỉ có thể tạo cuộc trò chuyện với bạn bè');
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
        throw new Error('Tên nhóm không được để trống');
    }

    if (participantIds.length < 2) {
        throw new Error('Nhóm phải có ít nhất 2 thành viên ngoài người tạo');
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
                throw new Error(`Người dùng ${participantId} không phải bạn bè của bạn`);
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.type !== 'group') {
        throw new Error('Chỉ có thể cập nhật cuộc trò chuyện nhóm');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Chỉ quản trị viên mới có thể cập nhật thông tin nhóm');
    }

    if (updates.name !== undefined) {
        if (updates.name.trim().length === 0) {
            throw new Error('Tên nhóm không được để trống');
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new Error('Bạn không phải thành viên của cuộc trò chuyện này');
    }

    if (conversation.type === 'private') {
        await ConversationModel.deleteOne({ _id: conversationId });
        await MessageModel.deleteMany({ conversationId });
        return { message: 'Xóa cuộc trò chuyện thành công' };
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
            return { message: 'Nhóm đã bị xóa (không còn thành viên)' };
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

        return { message: 'Rời nhóm thành công' };
    }
};

export const addGroupMember = async (
    conversationId: string,
    userId: string,
    newMemberId: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.type !== 'group') {
        throw new Error('Chỉ có thể thêm thành viên vào cuộc trò chuyện nhóm');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Chỉ quản trị viên mới có thể thêm thành viên');
    }

    const isAlreadyMember = conversation.participants.some(
        (p: any) => p.toString() === newMemberId
    );

    if (isAlreadyMember) {
        throw new Error('Người dùng đã là thành viên của nhóm');
    }

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: newMemberId },
            { user1Id: newMemberId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new Error('Chỉ có thể thêm bạn bè vào nhóm');
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.type !== 'group') {
        throw new Error('Chỉ có thể xóa thành viên khỏi cuộc trò chuyện nhóm');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Chỉ quản trị viên mới có thể xóa thành viên');
    }

    if (memberId === userId) {
        throw new Error('Quản trị viên không thể tự xóa mình, hãy dùng chức năng rời nhóm');
    }

    const isMember = conversation.participants.some(
        (p: any) => p.toString() === memberId
    );

    if (!isMember) {
        throw new Error('Người dùng không phải thành viên của nhóm');
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.type !== 'group') {
        throw new Error('Chỉ có thể giải tán cuộc trò chuyện nhóm');
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new Error('Chỉ quản trị viên mới có thể giải tán nhóm');
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
        throw new Error('Không tìm thấy cuộc trò chuyện');
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

// ─── Invite Link ──────────────────────────────────────────────────────────────

export const generateInviteToken = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện');
    if (conversation.type !== 'group') throw new Error('Chỉ cuộc trò chuyện nhóm mới có thể dùng link mời');
    if (conversation.adminId?.toString() !== userId) throw new Error('Chỉ quản trị viên mới có thể tạo link mời');

    // Reuse existing token if available
    if (conversation.inviteToken) {
        return { inviteToken: conversation.inviteToken };
    }

    const token = crypto.randomBytes(16).toString('hex');
    conversation.inviteToken = token;
    await conversation.save();
    return { inviteToken: token };
};

export const getInviteInfo = async (token: string) => {
    const conversation = await ConversationModel.findOne({ inviteToken: token })
        .populate('participants', 'displayName email avatar status')
        .populate('adminId', 'displayName email');

    if (!conversation) throw new Error('Invalid or expired invite link');

    return {
        _id: conversation._id,
        name: conversation.name,
        avatar: conversation.avatar,
        participantCount: conversation.participants.length,
        participants: (conversation.participants as any[]).slice(0, 5),
    };
};

export const joinByInvite = async (token: string, userId: string) => {
    const conversation = await ConversationModel.findOne({ inviteToken: token });
    if (!conversation) throw new Error('Link mời không hợp lệ hoặc đã hết hạn');
    if (conversation.type !== 'group') throw new Error('Link mời không hợp lệ');

    const isAlready = conversation.participants.some((p: any) => p.toString() === userId);
    if (isAlready) throw new Error('Bạn đã là thành viên của nhóm này');

    conversation.participants.push(new mongoose.Types.ObjectId(userId));
    await conversation.save();

    // System message
    try {
        const UserModel = (await import('../models/User')).default;
        const joiner = await UserModel.findById(userId).select('displayName');
        const displayName = joiner?.displayName || 'Ai đó';

        const systemMsg = await MessageModel.create({
            conversationId: conversation._id,
            senderId: userId,
            content: `${displayName} đã tham gia nhóm qua link mời`,
            type: 'system',
            status: 'sent',
        });
        await systemMsg.populate('senderId', 'displayName email avatar');

        conversation.lastMessageId = systemMsg._id as mongoose.Types.ObjectId;
        conversation.lastMessageAt = systemMsg.createdAt;
        await conversation.save();

        getIO().to(conversation._id.toString()).emit('new_message', systemMsg);
        getIO().to(conversation._id.toString()).emit('group_member_added', {
            conversationId: conversation._id,
            newMemberId: userId
        });
    } catch (_) { }

    await conversation.populate('participants', 'displayName email avatar status lastSeen');
    await conversation.populate('adminId', 'displayName email');

    emitToUser(userId, 'added_to_group', conversation);

    return conversation;
};

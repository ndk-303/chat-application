import ConversationModel from '../models/Conversation';
import MessageModel from '../models/Message';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { getIO, emitToUser } from '../socket/socketManager';
import { errorUtil } from '../utils/errorUtils';

export const getUserConversations = async (userId: string, page?: number, limit?: number) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // T-033: use userObjectId instead of string userId for type safety & index match
    const conversations = await ConversationModel.find({
        participants: userObjectId
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

    const now = new Date();

    // Sort by pinned first, then lastMessageAt descending
    visible.sort((a: any, b: any) => {
        const aPinned = !!(a.pinnedFor?.some((p: any) => p.userId.toString() === userId));
        const bPinned = !!(b.pinnedFor?.some((p: any) => p.userId.toString() === userId));
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();
    });

    // T-006: Paginate before computing unread counts to prevent memory bloat on large inboxes
    const pageNum = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : visible.length;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = (limit !== undefined && limit > 0) ? visible.slice(startIndex, startIndex + pageSize) : visible;

    // Compute unreadCount only for the returned slice of conversations
    const conversationIds = paginated.map((c) => c._id);
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

    // Attach unreadCount + isMuted + isPinned
    const result = paginated.map((conv) => {
        const obj = conv.toObject() as any;
        obj.unreadCount = unreadMap[conv._id.toString()] ?? 0;
        const muteEntry = conv.mutedFor?.find((m: any) => m.userId.toString() === userId);
        obj.isMuted = !!(muteEntry && (!muteEntry.mutedUntil || muteEntry.mutedUntil > now));
        obj.isPinned = !!(conv.pinnedFor?.some((p: any) => p.userId.toString() === userId));
        return obj;
    });

    return result;
};


export const getConversationById = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId)
        .populate('participants', 'displayName email avatar status lastSeen')
        .populate('adminId', 'displayName email')
        .populate('lastMessageId');

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
        throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);
    }

    return conversation;
};

export const createPrivateConversation = async (userId: string, targetUserId: string) => {
    if (userId === targetUserId) {
        throw new errorUtil('Không thể tạo cuộc trò chuyện với chính mình', 400);
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const targetObjId = new mongoose.Types.ObjectId(targetUserId);

    console.log('[createPrivateConversation] userId:', userId, 'targetUserId:', targetUserId);

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userObjId, user2Id: targetObjId },
            { user1Id: targetObjId, user2Id: userObjId }
        ]
    });

    console.log('[createPrivateConversation] friendship found:', friendship ? friendship._id : null);

    if (!friendship) {
        throw new errorUtil('Chỉ có thể tạo cuộc trò chuyện với bạn bè', 400);
    }

    const existingConversation = await ConversationModel.findOne({
        type: 'private',
        participants: { $all: [userObjId, targetObjId], $size: 2 }
    });

    if (existingConversation) {
        await existingConversation.populate('participants', 'displayName email avatar status lastSeen');
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
        throw new errorUtil('Tên nhóm không được để trống', 400);
    }

    if (participantIds.length < 2) {
        throw new errorUtil('Nhóm phải có ít nhất 2 thành viên ngoài người tạo', 400);
    }

    const allParticipants = [userId, ...participantIds.filter(id => id !== userId)];

    // Batch-fetch all friendships between the creator and participants in one query
    // instead of one query per participant (N+1 → 1).
    const otherParticipantIds = participantIds.filter(id => id !== userId);
    const friendships = await FriendshipModel.find({
        $or: otherParticipantIds.flatMap(id => [
            { user1Id: userId, user2Id: id },
            { user1Id: id, user2Id: userId },
        ])
    }).lean();

    const friendSet = new Set<string>(
        friendships.flatMap(f => [f.user1Id.toString(), f.user2Id.toString()])
    );

    const notFriends = otherParticipantIds.filter(id => !friendSet.has(id));
    if (notFriends.length > 0) {
        throw new errorUtil(
            `Người dùng sau không phải bạn bè của bạn: ${notFriends.join(', ')}`,
            400
        );
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
    } catch (err) {
        console.warn('[Socket] group_created emit failed', err);
    }

    return conversation;
};


export const updateGroupDetails = async (
    conversationId: string,
    userId: string,
    updates: { name?: string; avatar?: string }
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    if (conversation.type !== 'group') {
        throw new errorUtil('Chỉ có thể cập nhật cuộc trò chuyện nhóm', 400);
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new errorUtil('Chỉ quản trị viên mới có thể cập nhật thông tin nhóm', 400);
    }

    if (updates.name !== undefined) {
        if (updates.name.trim().length === 0) {
            throw new errorUtil('Tên nhóm không được để trống', 400);
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
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 400);
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
        } catch (err) {
            console.warn('[Socket] leaveConversation system message failed', err);
        }

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
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    if (conversation.type !== 'group') {
        throw new errorUtil('Chỉ có thể thêm thành viên vào cuộc trò chuyện nhóm', 400);
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new errorUtil('Chỉ quản trị viên mới có thể thêm thành viên', 400);
    }

    const isAlreadyMember = conversation.participants.some(
        (p: any) => p.toString() === newMemberId
    );

    if (isAlreadyMember) {
        throw new errorUtil('Người dùng đã là thành viên của nhóm', 400);
    }

    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: newMemberId },
            { user1Id: newMemberId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new errorUtil('Chỉ có thể thêm bạn bè vào nhóm', 400);
    }

    conversation.participants.push(new mongoose.Types.ObjectId(newMemberId));
    await conversation.save();

    try {
        emitToUser(newMemberId, 'added_to_group', conversation);
        getIO().to(conversationId).emit('group_member_added', {
            conversationId,
            newMemberId
        });
    } catch (err) {
        console.warn('[Socket] addGroupMember emit failed', err);
    }

    return conversation;
};

export const removeGroupMember = async (
    conversationId: string,
    userId: string,
    memberId: string
) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    if (conversation.type !== 'group') {
        throw new errorUtil('Chỉ có thể xóa thành viên khỏi cuộc trò chuyện nhóm', 400);
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new errorUtil('Chỉ quản trị viên mới có thể xóa thành viên', 400);
    }

    if (memberId === userId) {
        throw new errorUtil('Quản trị viên không thể tự xóa mình, hãy dùng chức năng rời nhóm', 400);
    }

    const isMember = conversation.participants.some(
        (p: any) => p.toString() === memberId
    );

    if (!isMember) {
        throw new errorUtil('Người dùng không phải thành viên của nhóm', 400);
    }

    conversation.participants = conversation.participants.filter(
        (p: any) => p.toString() !== memberId
    );

    await conversation.save();

    try {
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
    } catch (err) {
        console.warn('[Socket] removeGroupMember system message/emit failed', err);
    }

    return conversation;
};

export const dissolveGroup = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    if (conversation.type !== 'group') {
        throw new errorUtil('Chỉ có thể giải tán cuộc trò chuyện nhóm', 400);
    }

    if (conversation.adminId?.toString() !== userId) {
        throw new errorUtil('Chỉ quản trị viên mới có thể giải tán nhóm', 400);
    }

    const participantIds = conversation.participants.map((p: any) => p.toString());

    await ConversationModel.deleteOne({ _id: conversationId });
    await MessageModel.deleteMany({ conversationId });

    try {
        for (const participantId of participantIds) {
            emitToUser(participantId, 'group_dissolved', { conversationId });
        }
    } catch (err) {
        console.warn('[Socket] dissolveGroup emit failed', err);
    }

    return { message: 'Nhóm đã được giải tán' };
};

export const hideConversation = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
        throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    }

    const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new errorUtil('You are not a participant in this conversation', 400);
    }

    conversation.hiddenFor = (conversation.hiddenFor || []).filter(
        (h: any) => h.userId.toString() !== userId
    ) as any;

    (conversation.hiddenFor as any[]).push({ userId, hiddenAt: new Date() });

    await conversation.save();

    return { message: 'Đã xóa cuộc trò chuyện' };
};

// ─── Invite Link ──────────────────────────────────────────────────────────────

export const generateInviteToken = async (
    conversationId: string,
    userId: string,
    forceRegenerate: boolean = false,
    expiresInDays: number = 7
) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    if (conversation.type !== 'group') throw new errorUtil('Chỉ cuộc trò chuyện nhóm mới có thể dùng link mời', 400);
    if (conversation.adminId?.toString() !== userId) throw new errorUtil('Chỉ quản trị viên mới có thể tạo link mời', 400);

    // Reuse existing valid token if available and not forcing regeneration
    const now = new Date();
    if (!forceRegenerate && conversation.inviteToken && (!conversation.inviteTokenExpiresAt || conversation.inviteTokenExpiresAt > now)) {
        return {
            inviteToken: conversation.inviteToken,
            inviteTokenExpiresAt: conversation.inviteTokenExpiresAt
        };
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    conversation.inviteToken = token;
    conversation.inviteTokenExpiresAt = expiresAt;
    await conversation.save();
    return { inviteToken: token, inviteTokenExpiresAt: expiresAt };
};

export const revokeInviteToken = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 400);
    if (conversation.adminId?.toString() !== userId) throw new errorUtil('Chỉ quản trị viên mới có thể thu hồi link mời', 400);

    conversation.inviteToken = undefined;
    conversation.inviteTokenExpiresAt = undefined;
    await conversation.save();
    return { message: 'Đã thu hồi link mời thành công' };
};

export const getInviteInfo = async (token: string) => {
    const now = new Date();
    const conversation = await ConversationModel.findOne({
        inviteToken: token,
        $or: [
            { inviteTokenExpiresAt: null },
            { inviteTokenExpiresAt: { $gt: now } }
        ]
    })
        .populate('participants', 'displayName email avatar status')
        .populate('adminId', 'displayName email');

    if (!conversation) throw new errorUtil('Invalid or expired invite link', 400);

    return {
        _id: conversation._id,
        name: conversation.name,
        avatar: conversation.avatar,
        participantCount: conversation.participants.length,
        participants: (conversation.participants as any[]).slice(0, 5),
    };
};

export const joinByInvite = async (token: string, userId: string) => {
    const now = new Date();
    const conversation = await ConversationModel.findOne({
        inviteToken: token,
        $or: [
            { inviteTokenExpiresAt: null },
            { inviteTokenExpiresAt: { $gt: now } }
        ]
    });
    if (!conversation) throw new errorUtil('Link mời không hợp lệ hoặc đã hết hạn', 400);
    if (conversation.type !== 'group') throw new errorUtil('Link mời không hợp lệ', 400);

    const isAlready = conversation.participants.some((p: any) => p.toString() === userId);
    if (isAlready) throw new errorUtil('Bạn đã là thành viên của nhóm này', 400);

    conversation.participants.push(new mongoose.Types.ObjectId(userId));
    await conversation.save();

    // System message
    try {
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
    } catch (err) {
        console.warn('[Socket] joinByInvite system message/emit failed', err);
    }

    await conversation.populate('participants', 'displayName email avatar status lastSeen');
    await conversation.populate('adminId', 'displayName email');

    emitToUser(userId, 'added_to_group', conversation);

    return conversation;
};

// ─── Mute Conversation ────────────────────────────────────────────────────────

export const muteConversation = async (conversationId: string, userId: string, mutedUntil?: Date) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 404);
    const isParticipant = conversation.participants.some((p: any) => p.toString() === userId);
    if (!isParticipant) throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 403);
    conversation.mutedFor = (conversation.mutedFor || []).filter((m: any) => m.userId.toString() !== userId) as any;
    (conversation.mutedFor as any[]).push({ userId, mutedUntil: mutedUntil ?? null });
    await conversation.save();
    return { message: 'Đã tắt thông báo', isMuted: true };
};

export const unmuteConversation = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 404);
    conversation.mutedFor = (conversation.mutedFor || []).filter((m: any) => m.userId.toString() !== userId) as any;
    await conversation.save();
    return { message: 'Đã bật thông báo', isMuted: false };
};

// ─── Pin Conversation ─────────────────────────────────────────────────────────

export const pinConversation = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 404);
    const isParticipant = conversation.participants.some((p: any) => p.toString() === userId);
    if (!isParticipant) throw new errorUtil('Bạn không phải thành viên của cuộc trò chuyện này', 403);
    const alreadyPinned = (conversation.pinnedFor || []).some((p: any) => p.userId.toString() === userId);
    if (!alreadyPinned) {
        (conversation.pinnedFor as any[]).push({ userId, pinnedAt: new Date() });
        await conversation.save();
    }
    return { message: 'Đã ghim hội thoại', isPinned: true };
};

export const unpinConversation = async (conversationId: string, userId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new errorUtil('Không tìm thấy cuộc trò chuyện', 404);
    conversation.pinnedFor = (conversation.pinnedFor || []).filter((p: any) => p.userId.toString() !== userId) as any;
    await conversation.save();
    return { message: 'Đã bỏ ghim hội thoại', isPinned: false };
};
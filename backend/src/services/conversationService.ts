import ConversationModel from '../models/Conversation';
import MessageModel from '../models/Message';
import FriendshipModel from '../models/Friendship';
import mongoose from 'mongoose';
import { getIO, emitToUser } from '../socket/socketManager';

export const getUserConversations = async (userId: string) => {
    const conversations = await ConversationModel.find({
        participants: userId
    })
        .populate('participants', 'displayName email avatar status lastSeen')
        .populate('adminId', 'displayName email')
        .populate('lastMessageId')
        .sort({ lastMessageAt: -1 });

    return conversations;
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
            getIO().to(conversationId).emit('member_left', { conversationId, userId });
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
        emitToUser(memberId, 'removed_from_group', { conversationId });
        getIO().to(conversationId).emit('group_member_removed', {
            conversationId,
            memberId
        });
    } catch (_) { }

    return conversation;
};

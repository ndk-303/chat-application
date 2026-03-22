import { Request, Response } from 'express';
import * as conversationService from '../services/conversationService';

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const conversations = await conversationService.getUserConversations(userId);

        res.status(200).json({
            count: conversations.length,
            conversations
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getConversationById = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;

        const conversation = await conversationService.getConversationById(conversationId as string, userId);

        res.status(200).json(conversation);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

export const createConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { type, targetUserId, name, participantIds, avatar } = req.body;

        if (!type || !['private', 'group'].includes(type)) {
            return res.status(400).json({ message: 'Invalid conversation type' });
        }

        let conversation;

        if (type === 'private') {
            if (!targetUserId) {
                return res.status(400).json({ message: 'Target user ID is required for private conversation' });
            }
            conversation = await conversationService.createPrivateConversation(userId, targetUserId);
        } else {
            if (!name) {
                return res.status(400).json({ message: 'Group name is required' });
            }
            if (!participantIds || !Array.isArray(participantIds)) {
                return res.status(400).json({ message: 'Participant IDs are required for group' });
            }
            conversation = await conversationService.createGroupConversation(
                userId,
                name,
                participantIds,
                avatar
            );
        }

        res.status(201).json({
            message: 'Conversation created successfully',
            conversation
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;
        const { name, avatar } = req.body;

        const conversation = await conversationService.updateGroupDetails(
            conversationId as string,
            userId,
            { name, avatar }
        );

        res.status(200).json({
            message: 'Group updated successfully',
            conversation
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const leaveConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;

        const result = await conversationService.leaveConversation(conversationId as string, userId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const addMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;
        const { memberId } = req.body;

        if (!memberId) {
            return res.status(400).json({ message: 'Member ID is required' });
        }

        const conversation = await conversationService.addGroupMember(
            conversationId as string,
            userId,
            memberId
        );

        res.status(200).json({
            message: 'Member added successfully',
            conversation
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId, memberId } = req.params;

        const conversation = await conversationService.removeGroupMember(
            conversationId as string,
            userId,
            memberId as string
        );

        res.status(200).json({
            message: 'Member removed successfully',
            conversation
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const dissolveGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;

        const result = await conversationService.dissolveGroup(conversationId as string, userId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const hideConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;

        const result = await conversationService.hideConversation(conversationId as string, userId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};



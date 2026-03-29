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
            return res.status(400).json({ message: 'Loại cuộc trò chuyện không hợp lệ' });
        }

        let conversation;

        if (type === 'private') {
            if (!targetUserId) {
                return res.status(400).json({ message: 'Vui lòng cung cấp ID người dùng mục tiêu' });
            }
            conversation = await conversationService.createPrivateConversation(userId, targetUserId);
        } else {
            if (!name) {
                return res.status(400).json({ message: 'Vui lòng nhập tên nhóm' });
            }
            if (!participantIds || !Array.isArray(participantIds)) {
                return res.status(400).json({ message: 'Vui lòng cung cấp danh sách thành viên' });
            }
            conversation = await conversationService.createGroupConversation(
                userId,
                name,
                participantIds,
                avatar
            );
        }

        res.status(201).json({
            message: 'Tạo cuộc trò chuyện thành công',
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
            message: 'Cập nhật thông tin nhóm thành công',
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
            return res.status(400).json({ message: 'Vui lòng cung cấp ID thành viên' });
        }

        const conversation = await conversationService.addGroupMember(
            conversationId as string,
            userId,
            memberId
        );

        res.status(200).json({
            message: 'Thêm thành viên thành công',
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
            message: 'Xóa thành viên thành công',
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

export const generateInvite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;

        const result = await conversationService.generateInviteToken(conversationId as string, userId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getInviteInfo = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const info = await conversationService.getInviteInfo(token as string);

        res.status(200).json(info);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

export const joinByInvite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { token } = req.params;

        const conversation = await conversationService.joinByInvite(token as string, userId);

        res.status(200).json({
            message: 'Tham gia nhóm thành công',
            conversation
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

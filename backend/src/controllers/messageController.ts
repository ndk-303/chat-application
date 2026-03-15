import { Request, Response } from 'express';
import * as messageService from '../services/messageService';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;
        const { limit, before } = req.query;

        const messages = await messageService.getConversationMessages(
            conversationId as string,
            userId,
            limit ? parseInt(limit as string) : 50,
            before as string | undefined
        );

        res.status(200).json({
            count: messages.length,
            messages
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { conversationId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const message = await messageService.createMessage(conversationId as string, userId, content);

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const markAsSeen = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { messageId } = req.params;

        const message = await messageService.markMessageSeen(messageId as string, userId);

        res.status(200).json({
            message: 'Message marked as seen',
            data: message
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { messageId } = req.params;

        const result = await messageService.deleteUserMessage(messageId as string, userId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

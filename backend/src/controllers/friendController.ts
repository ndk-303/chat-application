import { Request, Response } from 'express';
import * as friendService from '../services/friendService';

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.userId;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ID người nhận' });
        }

        const friendRequest = await friendService.sendFriendRequest(senderId, receiverId);

        res.status(201).json({
            message: 'Gửi lời mời kết bạn thành công',
            friendRequest
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { requestId } = req.params;

        const result = await friendService.acceptFriendRequest(requestId as string, userId);

        res.status(200).json({
            message: 'Chấp nhận lời mời kết bạn thành công',
            ...result
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { requestId } = req.params;

        const friendRequest = await friendService.rejectFriendRequest(requestId as string, userId);

        res.status(200).json({
            message: 'Từ chối lời mời kết bạn thành công',
            friendRequest
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const friends = await friendService.getFriendsList(userId);

        res.status(200).json({
            count: friends.length,
            friends
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getReceivedRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const requests = await friendService.getReceivedRequests(userId);

        res.status(200).json({
            count: requests.length,
            requests
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getSentRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const requests = await friendService.getSentRequests(userId);

        res.status(200).json({
            count: requests.length,
            requests
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const unfriend = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { friendId } = req.params;

        const result = await friendService.removeFriendship(userId, friendId as string);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

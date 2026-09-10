import { Request, Response } from "express";
import * as userService from '../services/userService'
import { uploadCloundinary } from '../utils/uploadUtils';

/**
 * @deprecated Use POST /api/auth/register instead.
 * This endpoint is kept for compatibility but only an authenticated user
 * can call it, and it creates a new account with no privilege escalation.
 * TODO: remove from production routing.
 */
export const creatUser = async (req: Request, res: Response) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({message: error.message})
    }
}

export const getUsers = async (_: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(400).json({message: error.message})
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await userService.getUserById(userId);
    res.json(user);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id as string);
    res.json(user);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

export const updateCurrentProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await userService.updateCurrentUserProfile(userId, req.body);
    res.json({
      message: 'Cập nhật hồ sơ thành công',
      user
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Không tìm thấy file ảnh đại diện' });
    }

    const result = await uploadCloundinary(file.buffer, 'avatars', 'image');
    const avatarUrl = result.secure_url;

    const user = await userService.updateCurrentUserProfile(userId, { avatar: avatarUrl });
    return res.json({
      message: 'Cập nhật ảnh đại diện thành công',
      avatar: avatarUrl,
      user
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

/**
 * T-011/T-017: Users may only delete their own account.
 * Hard-delete is guarded by matching req.user.userId === req.params.id.
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const requesterId = (req as any).user.userId as string;
    const targetId = req.params.id as string;

    if (requesterId !== targetId) {
      return res.status(403).json({ message: 'Bạn chỉ có thể xóa tài khoản của chính mình' });
    }

    await userService.deleteUser(targetId);
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error: any) {
    return res.status(404).json({ message: error.message});
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!query) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm (q)' });
    }

    const users = await userService.searchUsers(query, userId, limit);
    res.json({
      count: users.length,
      users
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status } = req.body;
    if (!['online', 'offline', 'away', 'busy'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const user = await userService.updateUserStatus(userId, status);
    return res.json({ message: 'Cập nhật trạng thái thành công', user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
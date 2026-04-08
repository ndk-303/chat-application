import { Request, Response } from 'express';
import * as authService from '../services/authService'

export interface RegisterDto {
    displayName: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}


export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as LoginDto;

        const { accessToken, refreshToken } = await authService.login(email, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Đăng nhập thành công',
            accessToken: accessToken
        });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body as RegisterDto;

        if (!email || !password || !displayName) {
            return res.status(400).json({ message: 'Vui lòng nhập email, mật khẩu và tên hiển thị' });
        }
        const result = await authService.register(displayName, email, password);

        res.status(201).json({
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.',
            userId: result.userId,
            email: result.email,
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mã xác thực' });
        }

        const result = await authService.verifyEmail(email, code);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email' });
        }

        const result = await authService.resendVerificationCode(email);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: 'Không tìm thấy refresh token',
        });
    }

    try {
        const tokens = await authService.refreshToken(refreshToken);
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            accessToken: tokens.accessToken,
        });
    } catch (error: any) {
        return res.status(401).json({
            message: error.message,
        });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email' });
        }

        const result = await authService.requestPasswordReset(email);

        // SECURITY: resetToken KHÔNG được trả về client - chỉ gửi qua email
        res.status(200).json({
            message: result.message,
            expiresIn: result.expiresIn
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        const userId = (req as any).user?.userId;

        if (!newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
        }

        const result = await authService.resetPassword(
            newPassword,
            email,
            resetToken,
            userId
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const result = await authService.logout(userId);

        res.clearCookie('refreshToken');

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

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
        
        const {accessToken, refreshToken } = await authService.login(email, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, 
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Login successful',
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
            res.status(400).json({ message: 'Email, password, and displayName are required' });
        }
        const result = await authService.register(displayName, email, password);

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            userId: result.userId,
            email: result.email,
            verificationCode: result.verificationCode, 
            expiresIn: result.expiresIn
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const refreshToken = async(req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
        message: "Refresh token not found",
        });
    }

    try {
        const tokens = await authService.refreshToken(refreshToken);
        res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: false,
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
}

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            res.status(400).json({ message: 'Email and verification code are required' });
        }

        const result = await authService.verifyEmail(email, verificationCode);

        res.status(200).json({
            message: result.message,
            userId: result.userId,
            email: result.email
        });
    } catch (error: any) {
       res.status(400).json({ message: error.message });
    }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;

        if (!email) {
            res.status(400).json({ message: 'Email is required' });
        }

        const result = await authService.resendVerificationCode(email);

        res.status(200).json({
            message: result.message,
            verificationCode: result.verificationCode,
            expiresIn: result.expiresIn
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};




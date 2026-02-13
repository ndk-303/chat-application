import UserModel from "../models/User";
import { hashPassword, comparePassword } from "../utils/passwordUtils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils";
import { generateVerificationCode, generateCodeExpiration } from "../utils/verificationUtils";


export const login = async(email: string, password: string) => {
    const user = await UserModel.findOne({ email: email }).select('+password');
    if (!user) {
        throw new Error('Login failed, can not find user');
    }

    const compare = await comparePassword(password, user.password);
    if (!compare) {
        throw new Error('Login failed, wrong password');
    }

    const payload = {
        userId: user._id
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens = refreshToken;
    await user.save();

    return {accessToken, refreshToken};
}


export const register = async (displayName: string, email: string, password: string) => {
    const checked = await UserModel.findOne({ email: email });
    if (checked) {
        throw new Error('Email has existed already');
    }

    const hashedPassword = await hashPassword(password);
    
    const verificationCode = generateVerificationCode();
    const codeExpiration = generateCodeExpiration();

    const user = await UserModel.create({
        displayName,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationCode,
        emailVerificationExpires: codeExpiration,
        isEmailVerified: false
    });

    return {
        userId: user._id,
        email: user.email,
        message: 'Please verify your email.',
        verificationCode: verificationCode,
        expiresIn: '10 minutes'
    };
};

export const refreshToken = async(token: string) => {
    const payload = verifyRefreshToken(token);
    const checked = await UserModel.findOne({ refreshTokens: token });

    if (!payload) {
        throw new Error('Expired refresh token');
    }
    if (!checked) {
        throw new Error('Invalid refresh token');
    }
    
    const newAccessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role ?? 'USER',
    });

    const newRefreshToken = generateRefreshToken({
        userId: payload.userId,
        role: payload.role,
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}

export const verifyEmail = async (email: string, verifyCode: string) => {
    const user = await UserModel.findOne({ email: email }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
        throw new Error('User not found');
    }

    if (user.emailVerificationToken !== verifyCode) {
        throw new Error('Invalid verification code');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new Error('Verification code has expired');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
        message: 'Email verified successfully',
        userId: user._id,
        email: user.email
    };
};

export const resendVerificationCode = async (email: string) => {
    const user = await UserModel.findOne({ email: email });
    
    if (!user) {
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        throw new Error('Email is already verified');
    }

    const verificationCode = generateVerificationCode();
    const codeExpiration = generateCodeExpiration();

    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = codeExpiration;
    await user.save();

    return {
        message: 'Verification code sent successfully',
        verificationCode: verificationCode,
        expiresIn: '10 minutes'
    };
};


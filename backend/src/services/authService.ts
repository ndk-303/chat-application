import UserModel from "../models/User";
import { hashPassword, comparePassword, generateResetPwdToken, generateResetExpiration } from "../utils/passwordUtils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils";


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

    const user = await UserModel.create({
        displayName,
        email,
        password: hashedPassword,
    });

    return {
        userId: user._id,
        email: user.email,
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


export const requestPasswordReset = async (email: string) => {
    const user = await UserModel.findOne({ email: email });

    if (!user) {
        throw new Error('User not found');
    }

    const resetToken = generateResetPwdToken();
    const resetExpiration = generateResetExpiration();

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiration;
    await user.save();

    return {
        message: 'Password reset code sent successfully',
        resetToken: resetToken, 
        expiresIn: '1 hour'
    };
};

export const resetPassword = async (
    newPassword: string,
    email?: string,
    resetToken?: string,
    userId?: string
) => {
    let user;

    if (userId) {
        user = await UserModel.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
    } else if (email && resetToken) {
        user = await UserModel.findOne({ email: email }).select('+passwordResetToken +passwordResetExpires +password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.passwordResetToken !== resetToken) {
            throw new Error('Invalid reset token');
        }

        if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
            throw new Error('Reset token has expired');
        }

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
    } else {
        throw new Error('Invalid parameters for password reset/change');
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return {
        message: 'Password updated successfully'
    };
};

export const logout = async (userId: string) => {
    const user = await UserModel.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.refreshTokens = undefined;
    await user.save();

    return {
        message: 'Logged out successfully'
    };
};


import UserModel from "../models/User";
import { hashPassword, comparePassword, generateResetPwdToken, generateResetExpiration } from "../utils/passwordUtils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/emailUtils";
import { errorUtil } from "../utils/errorUtils";

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPExpiry(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15); // 15 phút
    return d;
}

export const login = async (email: string, password: string) => {
    const user = await UserModel.findOne({ email: email }).select('+password');
    if (!user) {
        throw new errorUtil('Đăng nhập thất bại, không tìm thấy người dùng', 400);
    }

    const compare = await comparePassword(password, user.password);
    if (!compare) {
        throw new errorUtil('Đăng nhập thất bại, mật khẩu không đúng', 400);
    }

    if (!user.isVerified) {
        throw new errorUtil('Email chưa được xác thực. Vui lòng kiểm tra hộp thư để lấy mã xác thực.', 400);
    }

    const payload = { userId: user._id };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
};

export const register = async (displayName: string, email: string, password: string) => {
    const checked = await UserModel.findOne({ email: email });
    if (checked) {
        throw new errorUtil('Email đã được sử dụng', 400);
    }

    const hashedPassword = await hashPassword(password);
    const code = generateOTP();
    const expires = getOTPExpiry();

    const user = await UserModel.create({
        displayName,
        email,
        password: hashedPassword,
        isVerified: false,
        emailVerificationCode: code,
        emailVerificationExpires: expires,
    });

    try {
        await sendVerificationEmail(email, code, displayName);
    } catch (emailErr) {
        console.error('[Register] Không thể gửi email xác thực:', emailErr);
    }

    return {
        userId: user._id,
        email: user.email,
    };
};

export const verifyEmail = async (email: string, code: string) => {
    const user = await UserModel.findOne({ email })
        .select('+emailVerificationCode +emailVerificationExpires');

    if (!user) {
        throw new errorUtil('Không tìm thấy người dùng', 400);
    }
    if (user.isVerified) {
        return { message: 'Email đã được xác thực trước đó' };
    }
    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
        throw new errorUtil('Mã xác thực không hợp lệ', 400);
    }
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new errorUtil('Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.', 400);
    }

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Xác thực email thành công' };
};

export const resendVerificationCode = async (email: string) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
        return { message: 'Nếu email tồn tại, mã mới đã được gửi.' };
    }
    if (user.isVerified) {
        throw new errorUtil('Email đã được xác thực', 400);
    }

    const code = generateOTP();
    const expires = getOTPExpiry();

    user.emailVerificationCode = code;
    user.emailVerificationExpires = expires;
    await user.save();

    await sendVerificationEmail(email, code, user.displayName);

    return { message: 'Đã gửi lại mã xác thực thành công' };
};

export const refreshToken = async (token: string) => {
    const payload = verifyRefreshToken(token);
    const checked = await UserModel.findOne({ refreshTokens: token });

    if (!payload) {
        throw new errorUtil('Refresh token đã hết hạn', 400);
    }
    if (!checked) {
        throw new errorUtil('Refresh token không hợp lệ', 400);
    }

    const newAccessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role ?? 'USER',
    });

    const newRefreshToken = generateRefreshToken({
        userId: payload.userId,
        role: payload.role,
    });

    // Rotate refresh token: lưu token mới vào DB, invalidate token cũ
    checked.refreshTokens = newRefreshToken;
    await checked.save();

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

export const requestPasswordReset = async (email: string) => {
    const user = await UserModel.findOne({ email: email });

    if (!user) {
        throw new errorUtil('Không tìm thấy người dùng', 400);
    }

    const resetToken = generateResetPwdToken();
    const resetExpiration = generateResetExpiration();

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiration;
    await user.save();

    return {
        message: 'Đã gửi mã đặt lại mật khẩu thành công',
        resetToken: resetToken,
        expiresIn: '1 giờ'
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
            throw new errorUtil('Không tìm thấy người dùng', 400);
        }
    } else if (email && resetToken) {
        user = await UserModel.findOne({ email: email }).select('+passwordResetToken +passwordResetExpires +password');

        if (!user) {
            throw new errorUtil('Không tìm thấy người dùng', 400);
        }

        if (user.passwordResetToken !== resetToken) {
            throw new errorUtil('Mã đặt lại mật khẩu không hợp lệ', 400);
        }

        if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
            throw new errorUtil('Mã đặt lại mật khẩu đã hết hạn', 400);
        }

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
    } else {
        throw new errorUtil('Tham số không hợp lệ để đặt lại mật khẩu', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return {
        message: 'Cập nhật mật khẩu thành công'
    };
};

export const logout = async (userId: string) => {
    const user = await UserModel.findById(userId);

    if (!user) {
        throw new errorUtil('Không tìm thấy người dùng', 400);
    }

    user.refreshTokens = undefined;
    await user.save();

    return {
        message: 'Đăng xuất thành công'
    };
};

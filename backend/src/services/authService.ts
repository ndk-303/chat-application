import crypto from 'crypto';
import UserModel from "../models/User";
import { hashPassword, comparePassword, generateResetPwdToken, generateResetExpiration } from "../utils/passwordUtils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailUtils";
import { errorUtil } from "../utils/errorUtils";

/** Generates a 6-digit OTP using a cryptographically secure RNG. */
function generateOTP(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

function getOTPExpiry(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d;
}

/** Hashes a refresh token with SHA-256 for secure DB storage (T-025). */
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export const login = async (email: string, password: string) => {
    const user = await UserModel.findOne({ email: email }).select('+password +refreshTokens');
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

    // T-025: Store hashed refresh tokens in an array (supports multi-device, capped at 5 sessions)
    const tokenHash = hashToken(refreshToken);
    const existingTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    user.refreshTokens = [...existingTokens.slice(-4), tokenHash];
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
        // T-032: Redact email PII in logs
        const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');
        console.log('[Register] Verification email sent to:', maskedEmail);
    } catch (emailErr) {
        console.error('[Register] ❌ Failed to send verification email:', emailErr);
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
    const user = await UserModel.findOne({ email })
        .select('+emailVerificationLastSent +emailVerificationExpires +emailVerificationCode');

    // T-044: Unified response to prevent user enumeration
    const genericResponse = { message: 'Nếu email tồn tại và chưa xác thực, mã mới đã được gửi.' };

    if (!user || user.isVerified) {
        return genericResponse;
    }

    // T-030: Enforce 60-second cooldown per account
    const now = new Date();
    if (user.emailVerificationLastSent && (now.getTime() - user.emailVerificationLastSent.getTime()) < 60000) {
        throw new errorUtil('Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã', 429);
    }

    const code = generateOTP();
    const expires = getOTPExpiry();

    user.emailVerificationCode = code;
    user.emailVerificationExpires = expires;
    user.emailVerificationLastSent = now;
    await user.save();

    await sendVerificationEmail(email, code, user.displayName);

    return { message: 'Đã gửi lại mã xác thực thành công' };
};

export const refreshToken = async (token: string) => {
    const payload = verifyRefreshToken(token);
    if (!payload) {
        throw new errorUtil('Refresh token đã hết hạn', 400);
    }

    const tokenHash = hashToken(token);
    const user = await UserModel.findById(payload.userId).select('+refreshTokens');

    if (!user) {
        throw new errorUtil('Refresh token không hợp lệ', 400);
    }

    const tokenList = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    const tokenIndex = tokenList.indexOf(tokenHash);

    // T-025: Reuse / Theft detection — if token is not in active list, invalidate all tokens
    if (tokenIndex === -1) {
        user.refreshTokens = [];
        await user.save();
        throw new errorUtil('Phát hiện token không hợp lệ hoặc đã qua sử dụng. Vui lòng đăng nhập lại.', 401);
    }

    const newAccessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role ?? 'USER',
    });

    const newRefreshToken = generateRefreshToken({
        userId: payload.userId,
        role: payload.role,
    });

    const newTokenHash = hashToken(newRefreshToken);

    // Rotate: replace old token hash with new token hash
    tokenList[tokenIndex] = newTokenHash;
    user.refreshTokens = tokenList;
    await user.save();

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

export const requestPasswordReset = async (email: string) => {
    const user = await UserModel.findOne({ email: email });

    // Always return a neutral message to prevent user-enumeration attacks.
    // If the user does not exist, we return early without leaking that fact.
    if (!user) {
        return {
            message: 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.',
            expiresIn: '1 giờ',
        };
    }

    const resetToken = generateResetPwdToken();
    const resetExpiration = generateResetExpiration();

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiration;
    await user.save();

    // Send reset code via email — use the already-fetched user object (no second DB query)
    try {
        await sendPasswordResetEmail(email, resetToken, user.displayName);
    } catch (emailErr) {
        console.error('[PasswordReset] ❌ Failed to send reset email:', emailErr);
    }

    // resetToken is intentionally NOT returned — it travels only via email
    return {
        message: 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.',
        expiresIn: '1 giờ',
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

export const logout = async (userId: string, token?: string) => {
    const user = await UserModel.findById(userId).select('+refreshTokens');

    if (!user) {
        throw new errorUtil('Không tìm thấy người dùng', 400);
    }

    if (token) {
        const tokenHash = hashToken(token);
        user.refreshTokens = (user.refreshTokens || []).filter((h: string) => h !== tokenHash);
    } else {
        user.refreshTokens = [];
    }
    await user.save();

    return {
        message: 'Đăng xuất thành công'
    };
};

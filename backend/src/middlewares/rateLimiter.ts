import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request } from 'express';

import { redisClient } from '../config/redis';

const clientIpKey = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip) ?? 'unknown';
  // Normalize IPv6 loopback và strip scope
  return ip.replace(/^::ffff:/, '').split('%')[0].trim();
};

// Tắt cảnh báo IPv6 (chúng ta đã xử lý thủ công)
const validate = { xForwardedForHeader: false, ip: false } as any;

const makeRedisStore = (prefix: string) =>
    new RedisStore({
        sendCommand: (...args: string[]) =>
            (redisClient as any).call(...args) as Promise<any>,
        prefix: `rl:${prefix}:`,
    });

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    keyGenerator: clientIpKey,
    store: makeRedisStore('login'),
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        });
    },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    keyGenerator: clientIpKey,
    store: makeRedisStore('register'),
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Bạn đã tạo quá nhiều tài khoản. Vui lòng thử lại sau 1 giờ.',
        });
    },
});

export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    keyGenerator: clientIpKey,
    store: makeRedisStore('pwd-reset'),
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.',
        });
    },
});

export const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    keyGenerator: clientIpKey,
    store: makeRedisStore('verify-email'),
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Quá nhiều lần xác thực. Vui lòng thử lại sau 15 phút.',
        });
    },
});

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    keyGenerator: clientIpKey,
    store: makeRedisStore('general'),
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        });
    },
});
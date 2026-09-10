import { Router } from "express";
import * as authController from '../controllers/authController'
import {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
    verifyEmailLimiter,
} from '../middlewares/rateLimiter';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', loginLimiter, authController.login);
router.post('/register', registerLimiter, authController.register);
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail);
router.post('/resend-verification', passwordResetLimiter, authController.resendVerificationCode);
router.post('/refresh-token', authController.refreshToken);
router.post('/request-password-reset', passwordResetLimiter, authController.requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);
// Logout requires a valid access token so we can identify whose session to invalidate
router.post('/logout', authMiddleware, authController.logout);

export default router;
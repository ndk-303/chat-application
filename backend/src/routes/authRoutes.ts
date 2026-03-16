import { Router } from "express";
import * as authController from '../controllers/authController'

const router = Router();

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh-token', authController.refreshToken);

router.post('/request-password-reset', authController.requestPasswordReset);

router.post('/reset-password', authController.resetPassword);

router.post('/logout', authController.logout);

export default router;
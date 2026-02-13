import { Router } from "express";
import * as authController from '../controllers/authController'

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     description: Đăng nhập với email và password. Refresh token sẽ được set trong httpOnly cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *       401:
 *         description: Email hoặc password không đúng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     description: Đăng ký tài khoản mới. Email sẽ nhận mã xác minh (mock).
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully. Please verify your email."
 *                 userId:
 *                   type: string
 *                   description: MongoDB ObjectId của user mới tạo
 *                 email:
 *                   type: string
 *                 verificationCode:
 *                   type: string
 *                   description: Mã xác minh 6 số (mock - để test)
 *                 expiresIn:
 *                   type: string
 *                   example: "10 minutes"
 *       400:
 *         description: Lỗi đăng ký (email đã tồn tại hoặc dữ liệu thiếu)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác minh email
 *     description: Xác minh email bằng mã xác minh được gửi sau khi đăng ký.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *                 description: Mã 6 số nhận được từ register
 *     responses:
 *       200:
 *         description: Xác minh email thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 userId:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Lỗi xác minh (mã sai, hết hạn, hoặc user không tìm thấy)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Invalid verification code"
 *                     - "Verification code has expired"
 *                     - "User not found"
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     description: Sử dụng refresh token (lưu trong httpOnly cookie) để lấy access token mới. Không cần gửi refresh token trong request body vì nó được quản lý bằng cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token mới (có hiệu lực trong 15 phút)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               description: Refresh token mới sẽ được set trong httpOnly cookie (có hiệu lực trong 7 ngày)
 *               example: "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Path=/"
 *       401:
 *         description: Lỗi làm mới token (refresh token không tìm thấy hoặc không hợp lệ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Refresh token not found"
 *                     - "Invalid or expired refresh token"
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/resend-verification-code:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Gửi lại mã xác minh
 *     description: Gửi lại mã xác minh nếu mã cũ hết hạn hoặc chưa nhận được.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi lại mã thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verification code sent successfully"
 *                 verificationCode:
 *                   type: string
 *                   description: Mã xác minh mới (mock - để test)
 *                 expiresIn:
 *                   type: string
 *                   example: "10 minutes"
 *       400:
 *         description: Lỗi gửi lại (email không tìm thấy hoặc đã được verify)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "User not found"
 *                     - "Email is already verified"
 */
router.post('/resend-verification-code', authController.resendVerificationCode);

export default router;
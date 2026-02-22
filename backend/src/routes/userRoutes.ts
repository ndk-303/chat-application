import { Router } from "express";
import * as userController from '../controllers/userController'
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.use(authMiddleware);
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         displayName:
 *           type: string
 *         avatar:
 *           type: string
 *           nullable: true
 *         bio:
 *           type: string
 *         status:
 *           type: string
 *           enum: [online, offline, away, busy]
 *         lastSeen:
 *           type: string
 *           format: date-time
 *         isEmailVerified:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         refreshTokens:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *         settings:
 *           type: object
 *           properties:
 *             notifications:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: boolean
 *                 friendRequests:
 *                   type: boolean
 *                 calls:
 *                   type: boolean
 *             privacy:
 *               type: object
 *               properties:
 *                 showOnlineStatus:
 *                   type: boolean
 *                 showLastSeen:
 *                   type: boolean
 *                 allowFriendRequests:
 *                   type: boolean
 *         blockedUsers:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách users
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Lỗi
 */
router.get('/', userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy user theo ID
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới
 *     tags:
 *       - User
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
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 description: (optional)
 *               bio:
 *                 type: string
 *                 description: (optional)
 *               status:
 *                 type: string
 *                 enum: [online, offline, away, busy]
 *                 description: (optional)
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Lỗi
 */
router.post('/', userController.creatUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Cập nhật user
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: (optional)
 *               displayName:
 *                 type: string
 *                 description: (optional)
 *               avatar:
 *                 type: string
 *                 description: (optional)
 *               bio:
 *                 type: string
 *                 description: (optional)
 *               password:
 *                 type: string
 *                 description: (optional)
 *               status:
 *                 type: string
 *                 enum: [online, offline, away, busy]
 *                 description: (optional)
 *               isEmailVerified:
 *                 type: boolean
 *                 description: (optional)
 *               isActive:
 *                 type: boolean
 *                 description: (optional)
 *               settings:
 *                 type: object
 *                 description: (optional)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy
 */
router.patch('/:id', userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa user
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', userController.deleteUser);

router.get('/search', userController.searchUsers);

export default router;


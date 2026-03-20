import { Router } from "express";
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import friendRoutes from './friendRoutes';
import conversationRoutes from './conversationRoutes';
import messageRoutes from './messageRoutes';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getIceServers } from '../controllers/iceController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.get('/ice-servers', authMiddleware, getIceServers);

export default router;

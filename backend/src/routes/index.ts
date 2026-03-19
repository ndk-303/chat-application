import { Router } from "express";
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import friendRoutes from './friendRoutes';
import conversationRoutes from './conversationRoutes';
import messageRoutes from './messageRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);

export default router;

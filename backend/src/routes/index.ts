import { Router } from "express";
import userRoutes from './userRoutes'
import authRoutes from './authRoutes'
import friendRoutes from './friendRoutes'

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/friends', friendRoutes);


export default router;
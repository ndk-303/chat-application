import { Router } from "express";
import * as userController from '../controllers/userController'
import { authMiddleware } from "../middlewares/authMiddleware";
// T-021: use shared uploadMiddleware (enforces 10 MB limit) instead of a bare multer instance
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateCurrentProfile);
router.patch('/me/avatar', uploadMiddleware.single('avatar'), userController.uploadAvatar);
router.patch('/me/status', userController.updateStatus);
router.get('/search', userController.searchUsers);

router.get('/:id', userController.getUserById);
// T-017: POST / kept for compatibility but deprecated — prefer /api/auth/register
router.post('/', userController.creatUser);
router.delete('/:id', userController.deleteUser);

export default router;

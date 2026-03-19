import { Router } from "express";
import * as userController from '../controllers/userController'
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.get('/me', userController.getUserById);

router.post('/', userController.creatUser);

router.delete('/:id', userController.deleteUser);

router.get('/search', userController.searchUsers);

router.patch('/me', userController.updateCurrentProfile);

export default router;


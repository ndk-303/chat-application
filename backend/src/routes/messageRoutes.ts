import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/:conversationId', messageController.getMessages);

router.post('/:conversationId', uploadMiddleware.array('files', 5), messageController.sendMessage);

router.patch('/:messageId/seen', messageController.markAsSeen);

router.patch('/:messageId/react', messageController.reactToMessage);

router.delete('/:messageId', messageController.deleteMessage);

export default router;


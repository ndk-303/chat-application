import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/:conversationId', messageController.getMessages);

router.post('/:conversationId', messageController.sendMessage);

router.patch('/:messageId/seen', messageController.markAsSeen);

router.delete('/:messageId', messageController.deleteMessage);

export default router;

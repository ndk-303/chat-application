import { Router } from 'express';
import * as conversationController from '../controllers/conversationController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', conversationController.getConversations);
router.get('/:conversationId', conversationController.getConversationById);

router.post('/', conversationController.createConversation);

router.patch('/:conversationId', conversationController.updateConversation);

router.delete('/:conversationId', conversationController.leaveConversation);

router.post('/:conversationId/members', conversationController.addMember);

router.delete('/:conversationId/members/:memberId', conversationController.removeMember);

export default router;

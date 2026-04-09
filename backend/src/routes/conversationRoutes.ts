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

router.delete('/:conversationId/dissolve', conversationController.dissolveGroup);

router.post('/:conversationId/hide', conversationController.hideConversation);

// Mute / Unmute
router.put('/:conversationId/mute', conversationController.muteConversation);
router.delete('/:conversationId/mute', conversationController.unmuteConversation);

// Pin / Unpin
router.put('/:conversationId/pin', conversationController.pinConversation);
router.delete('/:conversationId/pin', conversationController.unpinConversation);

// Invite link
router.post('/:conversationId/invite', conversationController.generateInvite);
router.get('/invite/:token', conversationController.getInviteInfo);
router.post('/invite/:token/join', conversationController.joinByInvite);

export default router;

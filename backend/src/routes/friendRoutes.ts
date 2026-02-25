import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import * as friendController from '../controllers/friendController';

const router = Router();
router.use(authMiddleware);

router.get('/', friendController.getFriends);

router.post('/request', friendController.sendFriendRequest);

router.post('/accept/:requestId', friendController.acceptFriendRequest);

router.post('/reject/:requestId', friendController.rejectFriendRequest);

router.get('/requests/received', friendController.getReceivedRequests);

router.get('/requests/sent', friendController.getSentRequests);

router.delete('/:friendId', friendController.unfriend);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendOrRequest,
  getFriends,
} from '../controllers/friendshipController';

const router = Router();

router.use(protect);

router.get('/friends', getFriends);

router.post('/request', sendFriendRequest);

router.put('/accept/:id', acceptFriendRequest);

router.delete('/:id', removeFriendOrRequest);

export default router;

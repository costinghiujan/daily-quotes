import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendOrRequest,
  getFriends,
  getBlockedUsers,
  blockUser,
  unblockUser,
} from '../controllers/friendshipController';

const router = Router();

router.use(protect);

router.get('/friends', getFriends);

router.post('/request', sendFriendRequest);

router.put('/accept/:id', acceptFriendRequest);

router.delete('/:id', removeFriendOrRequest);

router.get('/blocks', getBlockedUsers);

router.post('/blocks/:id', blockUser);

router.delete('/blocks/:id', unblockUser);

export default router;

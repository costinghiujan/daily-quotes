import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendOrRequest,
  getPendingRequests,
  getFriends,
  getBlockedUsers,
  blockUser,
  unblockUser,
  checkRelationshipStatus,
} from '../controllers/friendshipController';

const router = Router();

router.use(protect);

// Specific routes must be defined BEFORE parameterized routes to avoid conflicts
router.get('/friends', getFriends);
router.get('/requests', getPendingRequests);
router.get('/blocks', getBlockedUsers);

router.post('/request', sendFriendRequest);

router.put('/accept/:id', acceptFriendRequest);

router.post('/blocks/:id', blockUser);
router.delete('/blocks/:id', unblockUser);

router.delete('/:id', removeFriendOrRequest);

router.get('/status/:id', checkRelationshipStatus);

export default router;

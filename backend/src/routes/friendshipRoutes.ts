import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriendOrRequest, 
  getPendingRequests, 
  getFriends 
} from '../controllers/friendshipController';

const router = Router();

router.use(protect);

router.post('/request', sendFriendRequest);
router.put('/accept', acceptFriendRequest);
router.delete('/remove/:targetUserId', removeFriendOrRequest);
router.get('/pending', getPendingRequests);
router.get('/list', getFriends);

export default router;
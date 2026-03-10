import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriendOrRequest, 
} from '../controllers/friendshipController';

const router = Router();

router.use(protect);

router.post('/request', sendFriendRequest);

router.put('/accept/:id', acceptFriendRequest);

router.delete('/:id', removeFriendOrRequest);

export default router;
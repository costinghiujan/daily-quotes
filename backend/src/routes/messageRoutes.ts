import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getConversations, getMessageHistory } from '../controllers/messageController';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:id', getMessageHistory);

export default router;
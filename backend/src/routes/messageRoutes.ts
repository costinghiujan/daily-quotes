import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getConversations,
  getMessageHistory,
  getUnreadMessagesCount,
} from '../controllers/messageController';
import { uploadAttachment } from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadMessagesCount);
router.post('/attachment', protect, uploadAttachment.single('file'), uploadChatFile);
router.get('/:id', getMessageHistory);

export default router;

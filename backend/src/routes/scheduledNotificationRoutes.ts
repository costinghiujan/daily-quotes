import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getScheduledNotifications,
  createScheduledNotification,
  updateScheduledNotification,
  deleteScheduledNotification,
} from '../controllers/scheduledNotificationController';

const router = Router();

router.use(protect);

router.get('/', getScheduledNotifications);
router.post('/', createScheduledNotification);
router.put('/:id', updateScheduledNotification);
router.delete('/:id', deleteScheduledNotification);

export default router;

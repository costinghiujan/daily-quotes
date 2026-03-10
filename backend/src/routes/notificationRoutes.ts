import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  getNotifications,
  markAllAsRead
} from '../controllers/notificationController';

const router = Router();

router.use(protect);

router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

router.get('/', getNotifications);
router.put('/read', markAllAsRead);

export default router;
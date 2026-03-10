import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotificationSettings, updateNotificationSettings } from '../controllers/notificationController';

const router = Router();

router.use(protect);

router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

export default router;
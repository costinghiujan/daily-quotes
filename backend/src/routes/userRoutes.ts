import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  searchUsers,
  getUserProfile,
  updateProfile,
  getMyProfile,
  getAllBadges,
  uploadAvatar,
  uploadCoverPhoto,
  trackDailyLogin,
  getStreakInfo,
  recordReflection,
  getReflectionHistory,
} from '../controllers/userController';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/me', getMyProfile);
router.get('/badges/all', getAllBadges);
router.get('/streak', getStreakInfo);
router.get('/reflections', getReflectionHistory);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);

router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/cover-photo', upload.single('cover'), uploadCoverPhoto);
router.post('/track-login', trackDailyLogin);
router.post('/reflections', recordReflection);

export default router;

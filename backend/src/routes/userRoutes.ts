import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { searchUsers, getUserProfile, updateProfile, getMyProfile, uploadAvatar } from '../controllers/userController';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/me', getMyProfile);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);

router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router;
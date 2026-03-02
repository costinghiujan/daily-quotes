import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { searchUsers, getUserProfile, updateProfile, getMyProfile } from '../controllers/userController';

const router = Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/me', getMyProfile);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);

export default router;
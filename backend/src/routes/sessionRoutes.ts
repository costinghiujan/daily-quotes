import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getActiveSessions, revokeSession } from '../controllers/sessionController';

const router = Router();

router.use(protect);

router.get('/', getActiveSessions);
router.delete('/:sessionId', revokeSession);

export default router;

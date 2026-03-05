import { Router } from 'express';
import { toggleReaction } from '../controllers/reactionController';
import { 
  createQuote, 
  getAllQuotes, 
  getQuoteById, 
  updateQuote, 
  deleteQuote,
  getFeedQuotes
} from '../controllers/quoteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/feed', protect, getFeedQuotes);

router.post('/', protect, createQuote);
router.get('/', protect, getAllQuotes);
router.get('/:id', protect, getQuoteById);
router.put('/:id', protect, updateQuote);
router.delete('/:id', protect, deleteQuote);
router.post('/:id/react', protect, toggleReaction);

export default router;
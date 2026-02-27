import { Router } from 'express';
import { 
  createQuote, 
  getAllQuotes, 
  getQuoteById, 
  updateQuote, 
  deleteQuote 
} from '../controllers/quoteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createQuote);
router.get('/', protect, getAllQuotes);
router.get('/:id', protect, getQuoteById);
router.put('/:id', protect, updateQuote);
router.delete('/:id', protect, deleteQuote);

export default router;
import { Router } from 'express';
import { toggleReaction } from '../controllers/reactionController';
import {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
  getFeedQuotes,
  addComment,
  getCommentsForQuote,
  searchQuotes,
  getExploreFeed,
} from '../controllers/quoteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/feed', protect, getFeedQuotes);
router.get('/explore', protect, getExploreFeed);
router.get('/search', protect, searchQuotes);

router.post('/', protect, createQuote);
router.get('/', protect, getAllQuotes);
router.get('/:id', protect, getQuoteById);
router.put('/:id', protect, updateQuote);
router.delete('/:id', protect, deleteQuote);
router.post('/:id/react', protect, toggleReaction);
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', protect, getCommentsForQuote);

export default router;

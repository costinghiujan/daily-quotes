import { Router } from 'express';
import { createQuote, getAllQuotes, getQuoteById } from '../controllers/quoteController';

const router = Router();

router.post('/', createQuote);
router.get('/', getAllQuotes);
router.get('/:id', getQuoteById);

export default router;
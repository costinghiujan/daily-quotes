import { Router } from 'express';
import { createQuote } from '../controllers/quoteController';

const router = Router();

router.post('/', createQuote);

export default router;
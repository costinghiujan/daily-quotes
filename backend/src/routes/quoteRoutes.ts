import { Router } from 'express';
// Actualizăm importurile pentru a include noile funcții
import { 
  createQuote, 
  getAllQuotes, 
  getQuoteById, 
  updateQuote, 
  deleteQuote 
} from '../controllers/quoteController';

const router = Router();

router.post('/', createQuote);
router.get('/', getAllQuotes);
router.get('/:id', getQuoteById);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

export default router;
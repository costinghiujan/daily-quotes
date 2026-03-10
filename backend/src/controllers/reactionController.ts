import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './authController';
import { sendNotification, removeNotification } from '../utils/notificationHelper';

const VALID_REACTIONS = ['BLUE_HEART', 'APPLAUSE', 'SAD', 'TOUCHING', 'HUG', 'MIND_BLOWN'];

export const toggleReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const quoteId = parseInt(req.params.id as string, 10); 
    const { reactionType } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (!VALID_REACTIONS.includes(reactionType)) {
      res.status(400).json({ status: 'error', message: `Tip de reacție invalid.` });
      return;
    }

    const quoteCheck = await query('SELECT id, user_id FROM quotes WHERE id = $1', [quoteId]);
    if (quoteCheck.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Citatul nu există sau a fost șters.' });
      return;
    }
    
    const quoteAuthorId = quoteCheck.rows[0].user_id;

    const existingReaction = await query(
      'SELECT id FROM quote_reactions WHERE user_id = $1 AND quote_id = $2 AND reaction_type = $3',
      [userId, quoteId, reactionType]
    );

    if (existingReaction.rows.length > 0) {
      await query('DELETE FROM quote_reactions WHERE id = $1', [existingReaction.rows[0].id]);
      
      await removeNotification(quoteAuthorId, userId, 'REACTION_ADDED', quoteId);
      
      res.status(200).json({ status: 'success', action: 'removed', message: 'Reacția a fost eliminată.' });
      return;
    } else {
      await query(
        'INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3)',
        [userId, quoteId, reactionType]
      );
      
      await sendNotification(quoteAuthorId, userId, 'REACTION_ADDED', quoteId);
      
      res.status(201).json({ status: 'success', action: 'added', message: 'Reacția a fost adăugată.' });
      return;
    }
  } catch (error) {
    console.error('[Eroare Controller] Toggle Reaction:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};
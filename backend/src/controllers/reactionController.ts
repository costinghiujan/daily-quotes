import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './authController';

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
      res.status(400).json({ 
        status: 'error', 
        message: `Tip de reacție invalid. Sunt permise doar: ${VALID_REACTIONS.join(', ')}` 
      });
      return;
    }

    const quoteCheck = await query('SELECT id FROM quotes WHERE id = $1', [quoteId]);
    if (quoteCheck.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Citatul nu există sau a fost șters.' });
      return;
    }

    const existingReaction = await query(
      'SELECT id, reaction_type FROM quote_reactions WHERE user_id = $1 AND quote_id = $2',
      [userId, quoteId]
    );

    if (existingReaction.rows.length > 0) {
      const currentReaction = existingReaction.rows[0].reaction_type;
      const reactionId = existingReaction.rows[0].id;

      if (currentReaction === reactionType) {
        await query('DELETE FROM quote_reactions WHERE id = $1', [reactionId]);
        res.status(200).json({ status: 'success', action: 'removed', message: 'Reacția a fost ștearsă.' });
        return;
      } else {
        await query(
          'UPDATE quote_reactions SET reaction_type = $1 WHERE id = $2',
          [reactionType, reactionId]
        );
        res.status(200).json({ status: 'success', action: 'updated', message: 'Reacția a fost actualizată.' });
        return;
      }
    } else {
      await query(
        'INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3)',
        [userId, quoteId, reactionType]
      );
      res.status(201).json({ status: 'success', action: 'added', message: 'Reacția a fost adăugată.' });
      return;
    }
  } catch (error) {
    console.error('[Eroare Controller] Toggle Reaction:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};
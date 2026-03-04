import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './authController';

export const getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const currentSessionId = req.sessionId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `SELECT id, device_name, created_at 
       FROM sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC;`,
      [userId]
    );

    res.status(200).json({ 
      status: 'success', 
      data: {
        currentSessionId: currentSessionId, 
        sessions: result.rows
      }
    });
  } catch (error) {
    console.error('[Eroare Controller] Preluare sesiuni:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `DELETE FROM sessions 
       WHERE id = $1 AND user_id = $2 
       RETURNING id;`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ 
        status: 'error', 
        message: 'Sesiunea nu a fost găsită sau nu îți aparține.' 
      });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Dispozitivul a fost delogat cu succes.' });
  } catch (error) {
    console.error('[Eroare Controller] Revocare sesiune:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};
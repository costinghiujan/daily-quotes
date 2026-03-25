import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './quoteController';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(`
      SELECT DISTINCT ON (other_user_id)
        u.id AS user_id,
        u.username,
        u.full_name,
        u.profile_picture_url,
        m.text AS last_message,
        m.created_at AS last_message_date,
        m.is_read
      FROM (
        SELECT 
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id,
          text, created_at, is_read
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
      ) m
      JOIN users u ON u.id = m.other_user_id
      ORDER BY other_user_id, m.created_at DESC;
    `, [userId]);

    const sortedConversations = result.rows.sort((a, b) => 
      new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime()
    );

    res.status(200).json({ status: 'success', data: sortedConversations });
  } catch (error) {
    console.error('[Eroare Controller] Preluare conversații:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getMessageHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const otherUserId = parseInt(req.params.id as string, 10);

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (isNaN(otherUserId)) {
      res.status(400).json({ status: 'error', message: 'ID utilizator invalid.' });
      return;
    }

    await query(`
      UPDATE messages 
      SET is_read = TRUE 
      WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE
    `, [otherUserId, currentUserId]);

    const result = await query(`
      SELECT id, sender_id, receiver_id, text, is_read, created_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
      LIMIT 50;
    `, [currentUserId, otherUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare istoric chat:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getUnreadMessagesCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(`
      SELECT COUNT(*) 
      FROM messages 
      WHERE receiver_id = $1 AND is_read = FALSE
    `, [userId]);

    res.status(200).json({ status: 'success', data: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('[Eroare Controller] Numărare mesaje necitite:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};
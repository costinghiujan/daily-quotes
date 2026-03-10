import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './authController';

export const getNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    let result = await query(
      'SELECT notify_reactions, notify_friend_requests, notify_friend_accepted FROM notification_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      await query(
        'INSERT INTO notification_settings (user_id) VALUES ($1)',
        [userId]
      );
      
      result = await query(
        'SELECT notify_reactions, notify_friend_requests, notify_friend_accepted FROM notification_settings WHERE user_id = $1',
        [userId]
      );
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Eroare Controller] Preluare Setări Notificări:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { notify_reactions, notify_friend_requests, notify_friend_accepted } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (typeof notify_reactions !== 'boolean' || typeof notify_friend_requests !== 'boolean' || typeof notify_friend_accepted !== 'boolean') {
      res.status(400).json({ status: 'error', message: 'Toate setările trebuie să fie de tip adevărat/fals (boolean).' });
      return;
    }

    const result = await query(
      `UPDATE notification_settings 
       SET notify_reactions = $1, notify_friend_requests = $2, notify_friend_accepted = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING notify_reactions, notify_friend_requests, notify_friend_accepted`,
      [notify_reactions, notify_friend_requests, notify_friend_accepted, userId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Setările au fost salvate cu succes.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Eroare Controller] Actualizare Setări Notificări:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `SELECT 
         n.id, n.type, n.reference_id, n.is_read, n.created_at,
         u.id AS sender_id, u.username, u.full_name, u.profile_picture_url
       FROM notifications n
       JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('[Eroare Controller] Preluare Notificări:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    await query(
      `UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Toate notificările au fost marcate ca citite.'
    });
  } catch (error) {
    console.error('[Eroare Controller] Marcare Notificări Citite:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};
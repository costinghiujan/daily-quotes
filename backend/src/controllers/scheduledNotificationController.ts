import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getScheduledNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `SELECT id, hour, minute, emotion, is_active, created_at
       FROM scheduled_notifications
       WHERE user_id = $1
       ORDER BY hour, minute`,
      [userId],
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare notificări programate:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const createScheduledNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const { hour, minute, emotion } = req.body;

    if (hour === undefined || minute === undefined || !emotion) {
      res.status(400).json({ status: 'error', message: 'Ora, minutul și emoția sunt obligatorii.' });
      return;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      res.status(400).json({ status: 'error', message: 'Ora (0-23) sau minutul (0-59) invalid.' });
      return;
    }

    const validEmotions = ['motivational', 'inspirational', 'funny', 'philosophical', 'romantic', 'sad', 'calm', 'energetic'];
    if (!validEmotions.includes(emotion)) {
      res.status(400).json({ status: 'error', message: `Emoția trebuie să fie una dintre: ${validEmotions.join(', ')}` });
      return;
    }

    const result = await query(
      `INSERT INTO scheduled_notifications (user_id, hour, minute, emotion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, hour, minute, emotion, is_active, created_at`,
      [userId, hour, minute, emotion],
    );

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Creare notificare programată:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const updateScheduledNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const { hour, minute, emotion, is_active } = req.body;

    const existing = await query(
      `SELECT id FROM scheduled_notifications WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Notificarea programată nu a fost găsită.' });
      return;
    }

    const result = await query(
      `UPDATE scheduled_notifications
       SET hour = COALESCE($1, hour),
           minute = COALESCE($2, minute),
           emotion = COALESCE($3, emotion),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 AND user_id = $6
       RETURNING id, hour, minute, emotion, is_active, created_at`,
      [hour, minute, emotion, is_active, id, userId],
    );

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Actualizare notificare programată:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const deleteScheduledNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `DELETE FROM scheduled_notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Notificarea programată nu a fost găsită.' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Notificarea programată a fost ștearsă.' });
  } catch (error) {
    console.error('[Eroare Controller] Ștergere notificare programată:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

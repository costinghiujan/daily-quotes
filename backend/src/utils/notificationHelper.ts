import { query } from '../config/db';

export const sendNotification = async (
  recipientId: number,
  senderId: number,
  type: 'REACTION_ADDED' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED',
  referenceId: number
): Promise<void> => {
  try {
    if (recipientId === senderId) return;

    const settingsResult = await query(
      'SELECT notify_reactions, notify_friend_requests, notify_friend_accepted FROM notification_settings WHERE user_id = $1',
      [recipientId]
    );

    let shouldNotify = true;
    if (settingsResult.rows.length > 0) {
      const settings = settingsResult.rows[0];
      if (type === 'REACTION_ADDED') shouldNotify = settings.notify_reactions;
      if (type === 'FRIEND_REQUEST') shouldNotify = settings.notify_friend_requests;
      if (type === 'FRIEND_ACCEPTED') shouldNotify = settings.notify_friend_accepted;
    }

    if (!shouldNotify) return;

    await query(
      'DELETE FROM notifications WHERE recipient_id = $1 AND sender_id = $2 AND type = $3 AND reference_id = $4',
      [recipientId, senderId, type, referenceId]
    );

    await query(
      'INSERT INTO notifications (recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4)',
      [recipientId, senderId, type, referenceId]
    );
  } catch (error) {
    console.error('[Eroare Helper Notificări]:', error);
  }
};

export const removeNotification = async (
  recipientId: number,
  senderId: number,
  type: string,
  referenceId: number
): Promise<void> => {
  try {
    await query(
      'DELETE FROM notifications WHERE recipient_id = $1 AND sender_id = $2 AND type = $3 AND reference_id = $4',
      [recipientId, senderId, type, referenceId]
    );
  } catch (error) {
    console.error('[Eroare Helper Ștergere Notificări]:', error);
  }
};
import { query } from '../config/db';
import { sendPushNotification } from '../services/expoPushService';

export const sendNotification = async (
  recipientId: number,
  senderId: number,
  type: 'REACTION_ADDED' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'COMMENT_ADDED',
  referenceId: number,
): Promise<void> => {
  try {
    if (recipientId === senderId) return;

    const userResult = await query(
      `SELECT ns.notify_reactions, ns.notify_comments, ns.notify_friend_requests, ns.notify_friend_accepted, u.expo_push_token
       FROM notification_settings ns
       JOIN users u ON ns.user_id = u.id
       WHERE ns.user_id = $1`,
      [recipientId],
    );

    let shouldNotify = true;
    let pushToken: string | null = null;

    if (userResult.rows.length > 0) {
      const data = userResult.rows[0];
      pushToken = data.expo_push_token;

      if (type === 'REACTION_ADDED') shouldNotify = data.notify_reactions;
      if (type === 'COMMENT_ADDED') shouldNotify = data.notify_comments !== false;
      if (type === 'FRIEND_REQUEST') shouldNotify = data.notify_friend_requests;
      if (type === 'FRIEND_ACCEPTED') shouldNotify = data.notify_friend_accepted;
    }

    if (!shouldNotify) return;

    await query(
      'DELETE FROM notifications WHERE recipient_id = $1 AND sender_id = $2 AND type = $3 AND reference_id = $4',
      [recipientId, senderId, type, referenceId],
    );

    await query(
      'INSERT INTO notifications (recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4)',
      [recipientId, senderId, type, referenceId],
    );

    if (pushToken) {
      const senderResult = await query('SELECT username, full_name FROM users WHERE id = $1', [
        senderId,
      ]);
      const senderName =
        senderResult.rows[0]?.full_name || senderResult.rows[0]?.username || 'Cineva';

      let title = 'Notificare nouă';
      let body = '';

      switch (type) {
        case 'REACTION_ADDED':
          title = 'Nouă reacție 💙';
          body = `${senderName} a reacționat la citatul tău.`;
          break;
        case 'COMMENT_ADDED':
          title = 'Comentariu nou 💬';
          body = `${senderName} a lăsat un comentariu la postarea ta.`;
          break;
        case 'FRIEND_REQUEST':
          title = 'Cerere de prietenie 👋';
          body = `${senderName} dorește să se conecteze cu tine.`;
          break;
        case 'FRIEND_ACCEPTED':
          title = 'Cerere acceptată ✅';
          body = `${senderName} a acceptat cererea ta de prietenie.`;
          break;
      }

      await sendPushNotification(pushToken, title, body, { type, referenceId });
    }
  } catch (error) {
    console.error('[Eroare Helper Notificări]:', error);
  }
};

export const removeNotification = async (
  recipientId: number,
  senderId: number,
  type: string,
  referenceId: number,
): Promise<void> => {
  try {
    await query(
      'DELETE FROM notifications WHERE recipient_id = $1 AND sender_id = $2 AND type = $3 AND reference_id = $4',
      [recipientId, senderId, type, referenceId],
    );
  } catch (error) {
    console.error('[Eroare Helper Ștergere Notificări]:', error);
  }
};

export const sendMessagePushNotification = async (
  senderId: number,
  recipientId: number,
  messageText: string,
): Promise<void> => {
  try {
    const recipientResult = await query('SELECT expo_push_token FROM users WHERE id = $1', [
      recipientId,
    ]);

    const pushToken = recipientResult.rows[0]?.expo_push_token;
    if (!pushToken) return;

    const senderResult = await query('SELECT username, full_name FROM users WHERE id = $1', [
      senderId,
    ]);
    const senderName =
      senderResult.rows[0]?.full_name || senderResult.rows[0]?.username || 'Un prieten';

    const title = `Mesaj nou de la ${senderName} 💬`;
    const body = messageText.length > 60 ? `${messageText.substring(0, 60)}...` : messageText;

    await sendPushNotification(pushToken, title, body, {
      type: 'NEW_MESSAGE',
      senderId: senderId,
    });
  } catch (error) {
    console.error('[Eroare Helper Push Mesaje]:', error);
  }
};

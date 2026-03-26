import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './quoteController';
import { sendNotification } from '../utils/notificationHelper';
import { sendPushNotification } from '../services/expoPushService';

export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.id;

    const rawReceiverId = req.body.receiverId || req.body.friendId || req.params.id;
    const receiverId = parseInt(rawReceiverId as string, 10);

    if (!requesterId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (!receiverId || isNaN(receiverId)) {
      res
        .status(400)
        .json({ status: 'error', message: 'ID-ul utilizatorului lipsește sau este invalid.' });
      return;
    }

    if (requesterId === receiverId) {
      res.status(400).json({ status: 'error', message: 'Nu îți poți trimite cerere ție însuți.' });
      return;
    }

    const checkExisting = await query(
      'SELECT id FROM friendships WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)',
      [requesterId, receiverId],
    );

    if (checkExisting.rows.length > 0) {
      res
        .status(400)
        .json({ status: 'error', message: 'Există deja o interacțiune între acești utilizatori.' });
      return;
    }

    const result = await query(
      'INSERT INTO friendships (requester_id, receiver_id, status) VALUES ($1, $2, $3) RETURNING id',
      [requesterId, receiverId, 'pending'],
    );

    const friendshipId = result.rows[0].id;

    await sendNotification(receiverId, requesterId, 'FRIEND_REQUEST', friendshipId);

    try {
      const receiverData = await query('SELECT expo_push_token FROM users WHERE id = $1', [
        receiverId,
      ]);
      const senderData = await query('SELECT username FROM users WHERE id = $1', [requesterId]);

      const pushToken = receiverData.rows[0]?.expo_push_token;
      const senderName = senderData.rows[0]?.username || 'Un utilizator';

      if (pushToken) {
        await sendPushNotification(
          pushToken,
          'Cerere nouă de prietenie! 👤',
          `${senderName} dorește să se conecteze cu tine.`,
          { route: 'Notifications', type: 'FRIEND_REQUEST' },
        );
      }
    } catch (pushError) {
      console.error(
        '[Eroare Non-Critică] Trimitere push notification eșuată (Trimitere Cerere):',
        pushError,
      );
    }
    // ==========================================

    res.status(201).json({ status: 'success', message: 'Cererea de prietenie a fost trimisă.' });
  } catch (error) {
    console.error('[Eroare Controller] Trimitere Cerere:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const receiverId = req.user?.id;

    const rawFriendshipId = req.body.requestId || req.body.id || req.params.id;
    const friendshipId = parseInt(rawFriendshipId as string, 10);

    if (!receiverId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (!friendshipId || isNaN(friendshipId)) {
      res
        .status(400)
        .json({ status: 'error', message: 'ID-ul cererii lipsește sau este invalid.' });
      return;
    }

    const checkRequest = await query(
      'SELECT id, requester_id FROM friendships WHERE id = $1 AND receiver_id = $2 AND status = $3',
      [friendshipId, receiverId, 'pending'],
    );

    if (checkRequest.rows.length === 0) {
      res
        .status(404)
        .json({ status: 'error', message: 'Cererea nu există sau a fost deja procesată.' });
      return;
    }

    const requesterId = checkRequest.rows[0].requester_id;

    await query('UPDATE friendships SET status = $1 WHERE id = $2', ['accepted', friendshipId]);

    await sendNotification(requesterId, receiverId, 'FRIEND_ACCEPTED', friendshipId);

    await query(
      `UPDATE notifications 
       SET type = 'FRIEND_REQUEST_ACCEPTED' 
       WHERE recipient_id = $1 AND sender_id = $2 AND type = 'FRIEND_REQUEST' AND reference_id = $3`,
      [receiverId, requesterId, friendshipId],
    );

    try {
      const originalRequesterData = await query('SELECT expo_push_token FROM users WHERE id = $1', [
        requesterId,
      ]);
      const accepterData = await query('SELECT username FROM users WHERE id = $1', [receiverId]);

      const pushToken = originalRequesterData.rows[0]?.expo_push_token;
      const accepterName = accepterData.rows[0]?.username || 'Un prieten';

      if (pushToken) {
        await sendPushNotification(
          pushToken,
          'Cerere acceptată! ✅',
          `${accepterName} ți-a acceptat cererea de prietenie.`,
          { route: 'Notifications', type: 'FRIEND_ACCEPTED' },
        );
      }
    } catch (pushError) {
      console.error(
        '[Eroare Non-Critică] Trimitere push notification eșuată (Acceptare Cerere):',
        pushError,
      );
    }

    res.status(200).json({ status: 'success', message: 'Prietenia a fost acceptată.' });
  } catch (error) {
    console.error('[Eroare Controller] Acceptare Cerere:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const removeFriendOrRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const friendshipId = parseInt(req.params.id as string, 10);

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (!friendshipId || isNaN(friendshipId)) {
      res.status(400).json({ status: 'error', message: 'ID-ul interacțiunii este invalid.' });
      return;
    }

    const checkQuery = await query(
      'SELECT id FROM friendships WHERE id = $1 AND (requester_id = $2 OR receiver_id = $2)',
      [friendshipId, userId],
    );

    if (checkQuery.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Cererea sau prietenia nu există (a fost deja ștearsă).',
      });
      return;
    }

    await query('DELETE FROM friendships WHERE id = $1', [friendshipId]);

    await query(
      `DELETE FROM notifications WHERE reference_id = $1 AND type IN ('FRIEND_REQUEST', 'FRIEND_ACCEPTED')`,
      [friendshipId],
    );

    res.status(200).json({ status: 'success', message: 'Interacțiunea a fost ștearsă cu succes.' });
  } catch (error) {
    console.error('[Eroare Controller] Ștergere Prietenie:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    const result = await query(
      `
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, f.created_at
      FROM friendships f
      JOIN users u ON f.requester_id = u.id
      WHERE f.receiver_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `,
      [currentUserId],
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare cereri:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    const result = await query(
      `
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, u.bio
      FROM users u
      JOIN friendships f ON u.id = f.receiver_id
      WHERE f.requester_id = $1 AND f.status = 'accepted'
      
      UNION
      
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, u.bio
      FROM users u
      JOIN friendships f ON u.id = f.requester_id
      WHERE f.receiver_id = $1 AND f.status = 'accepted';
    `,
      [currentUserId],
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare prieteni:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const blockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.id;
    const blockedId = parseInt(req.params.id as string, 10);

    if (!blockerId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (isNaN(blockedId) || blockerId === blockedId) {
      res.status(400).json({ status: 'error', message: 'ID invalid sau acțiune nepermisă.' });
      return;
    }

    await query(
      `
      DELETE FROM friendships 
      WHERE (user_id1 = $1 AND user_id2 = $2) 
         OR (user_id1 = $2 AND user_id2 = $1)
    `,
      [blockerId, blockedId],
    );

    await query(
      `
      INSERT INTO blocks (blocker_id, blocked_id) 
      VALUES ($1, $2)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    `,
      [blockerId, blockedId],
    );

    res.status(200).json({ status: 'success', message: 'Utilizatorul a fost blocat.' });
  } catch (error) {
    console.error('[Eroare Controller] Blocare utilizator:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.id;
    const blockedId = parseInt(req.params.id as string, 10);

    if (!blockerId || isNaN(blockedId)) {
      res.status(400).json({ status: 'error', message: 'Date invalide.' });
      return;
    }

    await query(
      `
      DELETE FROM blocks 
      WHERE blocker_id = $1 AND blocked_id = $2
    `,
      [blockerId, blockedId],
    );

    res.status(200).json({ status: 'success', message: 'Utilizatorul a fost deblocat.' });
  } catch (error) {
    console.error('[Eroare Controller] Deblocare utilizator:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      `
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, b.created_at as blocked_at
      FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC
    `,
      [userId],
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare lista blocati:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

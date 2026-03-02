import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './quoteController';

export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.id;
    const { receiverId } = req.body;

    if (!requesterId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' }); return;
    }
    if (requesterId === receiverId) {
      res.status(400).json({ status: 'error', message: 'Nu îți poți trimite cerere ție.' }); return;
    }

    const existing = await query(`
      SELECT * FROM friendships 
      WHERE (requester_id = $1 AND receiver_id = $2) 
         OR (requester_id = $2 AND receiver_id = $1)
    `, [requesterId, receiverId]);

    if (existing.rows.length > 0) {
      res.status(400).json({ status: 'error', message: 'Există deja o cerere sau o prietenie activă între voi.' });
      return;
    }

    const result = await query(`
      INSERT INTO friendships (requester_id, receiver_id) 
      VALUES ($1, $2) RETURNING *;
    `, [requesterId, receiverId]);

    res.status(201).json({ status: 'success', message: 'Cerere de prietenie trimisă!', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Trimitere cerere:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const receiverId = req.user?.id;
    const { requesterId } = req.body;

    const result = await query(`
      UPDATE friendships 
      SET status = 'accepted' 
      WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *;
    `, [requesterId, receiverId]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Cererea nu a fost găsită sau a fost deja procesată.' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Cerere acceptată!', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Acceptare cerere:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const removeFriendOrRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.params;

    const result = await query(`
      DELETE FROM friendships 
      WHERE (requester_id = $1 AND receiver_id = $2) 
         OR (requester_id = $2 AND receiver_id = $1)
      RETURNING *;
    `, [currentUserId, targetUserId]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Nu s-a găsit nicio relație.' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Relație ștearsă cu succes.' });
  } catch (error) {
    console.error('[Eroare Controller] Ștergere prieten:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    const result = await query(`
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, f.created_at
      FROM friendships f
      JOIN users u ON f.requester_id = u.id
      WHERE f.receiver_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `, [currentUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare cereri:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    const result = await query(`
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, u.bio
      FROM users u
      JOIN friendships f ON u.id = f.receiver_id
      WHERE f.requester_id = $1 AND f.status = 'accepted'
      
      UNION
      
      SELECT u.id, u.username, u.full_name, u.profile_picture_url, u.bio
      FROM users u
      JOIN friendships f ON u.id = f.requester_id
      WHERE f.receiver_id = $1 AND f.status = 'accepted';
    `, [currentUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Preluare prieteni:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};
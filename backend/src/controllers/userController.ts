import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from './quoteController';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query.q as string;
    const currentUserId = req.user?.id;

    if (!searchQuery || searchQuery.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Te rugăm să introduci un termen de căutare.' });
      return;
    }

    const result = await query(`
      SELECT id, username, full_name, profile_picture_url 
      FROM users 
      WHERE (username ILIKE $1 OR full_name ILIKE $1) AND id != $2
      LIMIT 20;
    `, [`%${searchQuery}%`, currentUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut căuta utilizatorii:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userResult = await query(`
      SELECT id, username, full_name, bio, profile_picture_url, created_at 
      FROM users 
      WHERE id = $1;
    `, [id]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Utilizatorul nu a fost găsit.' });
      return;
    }

    const userProfile = userResult.rows[0];

    const quotesResult = await query(
      'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC;', 
      [id]
    );

    res.status(200).json({ 
      status: 'success', 
      data: {
        profile: userProfile,
        quotes: quotesResult.rows
      }
    });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut încărca profilul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, bio } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(`
      UPDATE users 
      SET full_name = COALESCE($1, full_name), 
          bio = COALESCE($2, bio)
      WHERE id = $3
      RETURNING id, username, full_name, bio, profile_picture_url;
    `, [full_name, bio, userId]);

    res.status(200).json({ status: 'success', message: 'Profil actualizat!', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut actualiza profilul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};
import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query.q as string;
    const currentUserId = req.user?.id;

    if (!searchQuery || searchQuery.trim() === '') {
      res
        .status(400)
        .json({ status: 'error', message: 'Te rugăm să introduci un termen de căutare.' });
      return;
    }

    const result = await query(
      `
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.profile_picture_url,
        f.status AS friendship_status,
        f.requester_id
      FROM users u
      LEFT JOIN friendships f 
        ON (f.requester_id = $2 AND f.receiver_id = u.id) 
        OR (f.requester_id = u.id AND f.receiver_id = $2)
      LEFT JOIN blocks b1 ON b1.blocker_id = $2 AND b1.blocked_id = u.id
      LEFT JOIN blocks b2 ON b2.blocker_id = u.id AND b2.blocked_id = $2
      WHERE (u.username ILIKE $1 OR u.full_name ILIKE $1) 
        AND u.id != $2
        AND b1.blocker_id IS NULL 
        AND b2.blocker_id IS NULL
      LIMIT 20;
    `,
      [`%${searchQuery}%`, currentUserId],
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut căuta utilizatorii:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const userResult = await query(
      `
      SELECT id, username, full_name, bio, profile_picture_url, cover_photo_url, created_at, xp, level 
      FROM users WHERE id = $1;
    `,
      [currentUserId],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Utilizatorul nu a fost găsit.' });
      return;
    }

    const badgesResult = await query(
      `
      SELECT b.id, b.name, b.description, b.icon_name, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC;
      `,
      [currentUserId],
    );

    const quotesResult = await query(
      'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC;',
      [currentUserId],
    );

    const profileData = {
      ...userResult.rows[0],
      badges: badgesResult.rows,
    };

    res.status(200).json({
      status: 'success',
      data: { profile: profileData, quotes: quotesResult.rows },
    });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut încărca profilul propriu:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `
      SELECT id, username, full_name, bio, profile_picture_url, created_at, xp, level 
      FROM users 
      WHERE id = $1;
    `,
      [id],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Utilizatorul nu a fost găsit.' });
      return;
    }

    const userProfile = userResult.rows[0];

    const badgesResult = await query(
      `
      SELECT b.id, b.name, b.description, b.icon_name, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC;
      `,
      [id],
    );

    const quotesResult = await query(
      'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC;',
      [id],
    );

    const profileData = {
      ...userProfile,
      badges: badgesResult.rows,
    };

    res.status(200).json({
      status: 'success',
      data: { profile: profileData, quotes: quotesResult.rows },
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

    const result = await query(
      `
      UPDATE users 
      SET full_name = COALESCE($1, full_name), 
          bio = COALESCE($2, bio)
      WHERE id = $3
      RETURNING id, username, full_name, bio, profile_picture_url;
    `,
      [full_name, bio, userId],
    );

    res
      .status(200)
      .json({ status: 'success', message: 'Profil actualizat!', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut actualiza profilul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getAllBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    const result = await query(
      `
      SELECT 
        b.id, 
        b.name, 
        b.description, 
        b.icon_name, 
        b.requirement_type, 
        b.requirement_value,
        ub.earned_at,
        CASE WHEN ub.badge_id IS NOT NULL THEN true ELSE false END AS earned
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
      ORDER BY b.id;
      `,
      [currentUserId],
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut încărca toate insignele:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const uploadCoverPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'Niciun fișier nu a fost recepționat.' });
      return;
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const result = await query(
      `
      UPDATE users 
      SET cover_photo_url = $1
      WHERE id = $2
      RETURNING id, username, full_name, bio, profile_picture_url, cover_photo_url;
    `,
      [fileUrl, userId],
    );

    res.status(200).json({
      status: 'success',
      message: 'Fotografie de copertă actualizată!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Eroare Controller] Încărcare copertă:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la salvarea copertei.' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'Niciun fișier nu a fost recepționat.' });
      return;
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const result = await query(
      `
      UPDATE users 
      SET profile_picture_url = $1
      WHERE id = $2
      RETURNING id, username, full_name, bio, profile_picture_url;
    `,
      [fileUrl, userId],
    );

    res.status(200).json({
      status: 'success',
      message: 'Fotografie de profil actualizată!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Eroare Controller] Încărcare avatar:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la salvarea pozei.' });
  }
};

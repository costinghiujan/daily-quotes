import { Request, Response } from 'express';
import { query } from '../config/db';
import { Quote } from '../models/Quote';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const createQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, author, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (!text || !author) {
      res.status(400).json({ status: 'error', message: 'Câmpurile "text" și "author" sunt obligatorii.' });
      return;
    }

    const insertQuery = `
      INSERT INTO quotes (text, author, category, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [text, author, category || null, userId];

    const result = await query(insertQuery, values);
    const newQuote: Quote = result.rows[0];

    res.status(201).json({ status: 'success', message: 'Citat adăugat cu succes!', data: newQuote });

  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut crea citatul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getAllQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC;', 
      [userId]
    );
    
    res.status(200).json({ status: 'success', results: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut prelua citatele:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la preluarea citatelor.' });
  }
};

export const getQuoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const result = await query(
      'SELECT * FROM quotes WHERE id = $1 AND user_id = $2;', 
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Citatul nu a fost găsit sau nu îți aparține.' });
      return;
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut prelua citatul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, author, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const updateQuery = `
      UPDATE quotes 
      SET text = COALESCE($1, text), 
          author = COALESCE($2, author), 
          category = COALESCE($3, category)
      WHERE id = $4 AND user_id = $5
      RETURNING *;
    `;
    
    const result = await query(updateQuery, [text, author, category, id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Citatul nu a putut fi actualizat (posibil să nu îți aparțină).' });
      return;
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut actualiza citatul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const deleteQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }
    
    const result = await query(
      'DELETE FROM quotes WHERE id = $1 AND user_id = $2 RETURNING *;', 
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Citatul nu a putut fi șters (posibil să nu îți aparțină).' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Citat șters cu succes.', deletedData: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut șterge citatul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getFeedQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const feedQuery = `
      SELECT 
        q.id, 
        q.text, 
        q.author AS original_author, 
        q.created_at,
        u.id AS post_user_id, 
        u.username, 
        u.full_name, 
        u.profile_picture_url,
        COUNT(CASE WHEN qr.reaction_type = 'BLUE_HEART' THEN 1 END) AS blue_heart_count,
        COUNT(CASE WHEN qr.reaction_type = 'APPLAUSE' THEN 1 END) AS applause_count,
        COUNT(CASE WHEN qr.reaction_type = 'SAD' THEN 1 END) AS sad_count,
        COUNT(CASE WHEN qr.reaction_type = 'TOUCHING' THEN 1 END) AS touching_count,
        COUNT(CASE WHEN qr.reaction_type = 'HUG' THEN 1 END) AS hug_count,
        COUNT(CASE WHEN qr.reaction_type = 'MIND_BLOWN' THEN 1 END) AS mind_blown_count,
        MAX(CASE WHEN qr.user_id = $1 THEN qr.reaction_type ELSE NULL END) AS user_reaction
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_reactions qr ON q.id = qr.quote_id
      WHERE q.user_id = $1 
         OR q.user_id IN (
            SELECT CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END
            FROM friendships f
            WHERE (f.requester_id = $1 OR f.receiver_id = $1) AND f.status = 'accepted'
         )
      GROUP BY q.id, u.id
      ORDER BY q.created_at DESC
      LIMIT 50;
    `;

    const result = await query(feedQuery, [currentUserId]);

    res.status(200).json({ 
      status: 'success', 
      results: result.rows.length, 
      data: result.rows 
    });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut încărca feed-ul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la încărcarea feed-ului.' });
  }
};
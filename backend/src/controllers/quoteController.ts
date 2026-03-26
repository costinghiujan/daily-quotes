import { Request, Response } from 'express';
import { query } from '../config/db';
import { Quote } from '../models/Quote';
import { sendNotification } from '../utils/notificationHelper';

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
      res
        .status(400)
        .json({ status: 'error', message: 'Câmpurile "text" și "author" sunt obligatorii.' });
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

    res
      .status(201)
      .json({ status: 'success', message: 'Citat adăugat cu succes!', data: newQuote });
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
      [userId],
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

    const result = await query('SELECT * FROM quotes WHERE id = $1 AND user_id = $2;', [
      id,
      userId,
    ]);

    if (result.rows.length === 0) {
      res
        .status(404)
        .json({ status: 'error', message: 'Citatul nu a fost găsit sau nu îți aparține.' });
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
      res.status(404).json({
        status: 'error',
        message: 'Citatul nu a putut fi actualizat (posibil să nu îți aparțină).',
      });
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

    const result = await query('DELETE FROM quotes WHERE id = $1 AND user_id = $2 RETURNING *;', [
      id,
      userId,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Citatul nu a putut fi șters (posibil să nu îți aparțină).',
      });
      return;
    }

    res
      .status(200)
      .json({ status: 'success', message: 'Citat șters cu succes.', deletedData: result.rows[0] });
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
        ARRAY_REMOVE(ARRAY_AGG(CASE WHEN qr.user_id = $1 THEN qr.reaction_type END), NULL) AS user_reactions
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
      data: result.rows,
    });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut încărca feed-ul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la încărcarea feed-ului.' });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = parseInt(String(req.params.id), 10);
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    if (isNaN(quoteId)) {
      res.status(400).json({ status: 'error', message: 'ID-ul citatului este invalid.' });
      return;
    }

    if (!text || text.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Comentariul nu poate fi gol.' });
      return;
    }

    const insertQuery = `
      INSERT INTO comments (text, user_id, quote_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await query(insertQuery, [text.trim(), userId, quoteId]);
    const newComment = result.rows[0];

    const getQuoteQuery = 'SELECT user_id FROM quotes WHERE id = $1';
    const quoteRes = await query(getQuoteQuery, [quoteId]);
    const quoteOwnerId = quoteRes.rows[0]?.user_id;

    if (quoteOwnerId && quoteOwnerId !== userId) {
      console.log(
        `[Push Debug] Se trimite notificarea de comentariu de la ${userId} către ${quoteOwnerId}`,
      );

      await sendNotification(quoteOwnerId, userId, 'COMMENT_ADDED', quoteId);
    }

    const userQuery = `SELECT username, full_name, profile_picture_url FROM users WHERE id = $1;`;
    const userResult = await query(userQuery, [userId]);
    const userDetails = userResult.rows[0];

    const commentWithUser = {
      ...newComment,
      ...userDetails,
    };

    res.status(201).json({ status: 'success', data: commentWithUser });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut adăuga comentariul:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă a serverului.' });
  }
};

export const getCommentsForQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const commentsQuery = `
      SELECT 
        c.id, c.text, c.created_at, c.user_id,
        u.username, u.full_name, u.profile_picture_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.quote_id = $1
      ORDER BY c.created_at ASC;
    `;

    const result = await query(commentsQuery, [quoteId]);

    res.status(200).json({ status: 'success', results: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut prelua comentariile:', error);
    res
      .status(500)
      .json({ status: 'error', message: 'Eroare internă la preluarea comentariilor.' });
  }
};

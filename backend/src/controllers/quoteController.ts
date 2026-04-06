import { Request, Response } from 'express';
import { query } from '../config/db';
import { sendNotification } from '../utils/notificationHelper';
import { GamificationService, XP_VALUES } from '../services/gamificationService';

export type AuthRequest = Request & {
  user?: {
    id: number;
    username: string;
    email: string;
  };
  sessionId?: number;
};

const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/#[\w\u0590-\u05ff]+/g);
  if (!matches) return [];

  const cleanTags = matches.map((tag) => tag.substring(1).toLowerCase());
  return [...new Set(cleanTags)];
};

export const createQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, author, category } = req.body;
    const userId = req.user?.id;

    if (!text || !author) {
      res.status(400).json({ status: 'error', message: 'Textul și autorul sunt obligatorii.' });
      return;
    }

    const extractedHashtags = extractHashtags(text);

    // 2. TODO (FAZA 3): Aici vom apela motorul local Ollama pentru a obține `embedding`-ul.
    // Momentan vom salva NULL, pregătind terenul.
    const embedding = null;

    const result = await query(
      `INSERT INTO quotes (text, author, category, user_id, hashtags, embedding) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [text, author, category, userId, extractedHashtags, embedding],
    );

    if (userId) {
      try {
        await GamificationService.addXp(userId, XP_VALUES.ADD_QUOTE);
        await GamificationService.evaluateBadges(userId);
      } catch (gamificationError) {
        console.error('[Avertisment] Eroare la gamificare (createQuote):', gamificationError);
      }
    }

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] creare citat:', error);
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
          q.id, q.text, q.author AS original_author, q.created_at,
          u.id AS post_user_id, u.username, u.full_name, u.profile_picture_url,
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
        LEFT JOIN blocks b1 ON b1.blocker_id = $1 AND b1.blocked_id = u.id
        LEFT JOIN blocks b2 ON b2.blocker_id = u.id AND b2.blocked_id = $1
        WHERE (
            q.user_id = $1 
            OR q.user_id IN (
                SELECT CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END
                FROM friendships f
                WHERE (f.requester_id = $1 OR f.receiver_id = $1) AND f.status = 'accepted'
            )
        )
        AND b1.blocker_id IS NULL 
        AND b2.blocker_id IS NULL
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

    try {
      await GamificationService.addXp(userId, XP_VALUES.ADD_COMMENT);
      await GamificationService.evaluateBadges(userId);
    } catch (gamificationError) {
      console.error('[Avertisment] Eroare la gamificare (addComment):', gamificationError);
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

export const searchQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query.q as string;
    const currentUserId = req.user?.id;

    if (!searchQuery || searchQuery.trim() === '') {
      res
        .status(400)
        .json({ status: 'error', message: 'Te rugăm să introduci un termen de căutare.' });
      return;
    }

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const searchSQL = `
      SELECT 
        q.id, q.text, q.author AS original_author, q.created_at,
        u.id AS post_user_id, u.username, u.full_name, u.profile_picture_url,
        COUNT(CASE WHEN qr.reaction_type = 'BLUE_HEART' THEN 1 END) AS blue_heart_count,
        ARRAY_REMOVE(ARRAY_AGG(CASE WHEN qr.user_id = $2 THEN qr.reaction_type END), NULL) AS user_reactions
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_reactions qr ON q.id = qr.quote_id
      LEFT JOIN blocks b1 ON b1.blocker_id = $2 AND b1.blocked_id = u.id
      LEFT JOIN blocks b2 ON b2.blocker_id = u.id AND b2.blocked_id = $2
      WHERE (q.text ILIKE $1 OR q.author ILIKE $1)
        AND b1.blocker_id IS NULL 
        AND b2.blocker_id IS NULL
      GROUP BY q.id, u.id
      ORDER BY q.created_at DESC
      LIMIT 30;
    `;

    const result = await query(searchSQL, [`%${searchQuery}%`, currentUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-au putut căuta citatele:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la căutarea citatelor.' });
  }
};

export const getExploreFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const exploreSQL = `
      SELECT 
        q.id, q.text, q.author AS original_author, q.created_at,
        u.id AS post_user_id, u.username, u.full_name, u.profile_picture_url,
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
      LEFT JOIN blocks b1 ON b1.blocker_id = $1 AND b1.blocked_id = u.id
      LEFT JOIN blocks b2 ON b2.blocker_id = u.id AND b2.blocked_id = $1
      WHERE q.user_id != $1
        AND q.user_id NOT IN (
            SELECT CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END
            FROM friendships f
            WHERE (f.requester_id = $1 OR f.receiver_id = $1) AND f.status = 'accepted'
        )
        AND b1.blocker_id IS NULL 
        AND b2.blocker_id IS NULL
      GROUP BY q.id, u.id
      ORDER BY RANDOM()
      LIMIT 20;
    `;

    const result = await query(exploreSQL, [currentUserId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut încărca Explore Feed:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

export const getQuoteOfTheDay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ status: 'error', message: 'Neautorizat.' });
      return;
    }

    const sql = `
      SELECT 
        q.id, q.text, q.author AS original_author, q.created_at,
        u.id AS post_user_id, u.username, u.full_name, u.profile_picture_url,
        COUNT(qr.id) AS total_reactions,
        COUNT(CASE WHEN qr.reaction_type = 'BLUE_HEART' THEN 1 END) AS blue_heart_count,
        ARRAY_REMOVE(ARRAY_AGG(CASE WHEN qr.user_id = $1 THEN qr.reaction_type END), NULL) AS user_reactions
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_reactions qr ON q.id = qr.quote_id
      LEFT JOIN blocks b1 ON b1.blocker_id = $1 AND b1.blocked_id = u.id
      LEFT JOIN blocks b2 ON b2.blocker_id = u.id AND b2.blocked_id = $1
      WHERE q.created_at >= NOW() - INTERVAL '24 HOURS'
        AND b1.blocker_id IS NULL 
        AND b2.blocker_id IS NULL
      GROUP BY q.id, u.id
      ORDER BY total_reactions DESC, q.created_at DESC
      LIMIT 1;
    `;

    const result = await query(sql, [currentUserId]);

    if (result.rowCount === 0) {
      res.status(200).json({ status: 'success', data: null });
      return;
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut obține Citatul Zilei:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă.' });
  }
};

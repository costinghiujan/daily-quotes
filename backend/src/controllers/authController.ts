import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

export interface AuthRequest extends Request {
  user?: any;
  sessionId?: number;
}

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ status: 'error', message: 'Toate câmpurile sunt obligatorii.' });
      return;
    }

    const userExists = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      res.status(409).json({ status: 'error', message: 'Email-ul sau username-ul este deja folosit.' });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    res.status(201).json({
      status: 'success',
      message: 'Contul a fost creat cu succes!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[Eroare Controller] Register:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la înregistrare.' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ status: 'error', message: 'Introdu email/username și parola.' });
      return;
    }

    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1 OR username = $1',
      [identifier]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ status: 'error', message: 'Credențiale invalide.' });
      return;
    }

    const userAgent = req.headers['user-agent'] || 'Dispozitiv Necunoscut';

    const sessionResult = await query(
      'INSERT INTO sessions (user_id, device_name) VALUES ($1, $2) RETURNING id',
      [user.id, userAgent]
    );
    const sessionId = sessionResult.rows[0].id;

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET lipsă!');
    }

    const token = jwt.sign(
      { id: user.id, sessionId: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password_hash, ...safeUserData } = user;

    res.status(200).json({
      status: 'success',
      message: 'Autentificare reușită!',
      data: { user: safeUserData, token }
    });

  } catch (error) {
    console.error('[Eroare Controller] Login:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la autentificare.' });
  }
};

export const logoutUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.sessionId; 

    if (!sessionId) {
      res.status(400).json({ status: 'error', message: 'Nicio sesiune activă detectată.' });
      return;
    }

    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    res.status(200).json({ status: 'success', message: 'Te-ai delogat cu succes.' });
  } catch (error) {
    console.error('[Eroare Controller] Logout:', error);
    res.status(500).json({ status: 'error', message: 'Eroare internă la delogare.' });
  }
};
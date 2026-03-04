import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

export const protect = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Neautorizat, lipsește token-ul.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.sessionId) {
      const sessionCheck = await query('SELECT id FROM sessions WHERE id = $1', [decoded.sessionId]);
      if (sessionCheck.rows.length === 0) {
        res.status(401).json({ status: 'error', message: 'Sesiunea a fost revocată. Te rugăm să te loghezi din nou.' });
        return;
      }
    }

    const result = await query('SELECT id, username FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      res.status(401).json({ status: 'error', message: 'Utilizatorul asociat acestui token nu mai există.' });
      return;
    }

    req.user = result.rows[0];
    req.sessionId = decoded.sessionId;
    
    next();
  } catch (error) {
    console.error('[Middleware Eroare]', error);
    res.status(401).json({ status: 'error', message: 'Token invalid sau expirat.' });
  }
};
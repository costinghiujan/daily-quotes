import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../controllers/quoteController'; 

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ 
      status: 'error', 
      message: 'Acces interzis. Token lipsă sau invalid.' 
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('FATAL ERROR: JWT_SECRET lipsește din .env');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('[Eroare Middleware] Autentificare eșuată:', error);
    res.status(403).json({ 
      status: 'error', 
      message: 'Sesiune expirată sau token invalid. Te rugăm să te loghezi din nou.' 
    });
  }
};
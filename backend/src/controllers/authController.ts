import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Toate câmpurile (username, email, parolă) sunt obligatorii.' 
      });
      return;
    }

    const userExists = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      res.status(409).json({ 
        status: 'error', 
        message: 'Email-ul sau username-ul este deja folosit de alt cont.' 
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      status: 'success',
      message: 'Contul a fost creat cu succes!',
      data: newUser
    });

  } catch (error) {
    console.error('[Eroare Auth Controller - Register]:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Eroare internă a serverului la înregistrare.' 
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Te rugăm să introduci email/username și parola.' 
      });
      return;
    }

    const result = await query(
      `SELECT id, username, email, password_hash 
       FROM users 
       WHERE email = $1 OR username = $1`,
      [identifier]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Credențiale invalide. Verifică datele introduse.' 
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Credențiale invalide. Verifică datele introduse.' 
      });
      return;
    }

    const { password_hash, ...safeUserData } = user;

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('FATAL ERROR: JWT_SECRET nu este definit în variabilele de mediu!');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      }, 
      jwtSecret,
      { expiresIn: '7d' } 
    );

    res.status(200).json({
      status: 'success',
      message: 'Autentificare reușită!',
      data: safeUserData
    });

  } catch (error) {
    console.error('[Eroare Auth Controller - Login]:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Eroare internă a serverului la autentificare.' 
    });
  }
};
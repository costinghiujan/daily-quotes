import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';

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
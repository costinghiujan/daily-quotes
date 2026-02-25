import { Request, Response } from 'express';
import { query } from '../config/db';
import { Quote } from '../models/Quote';

export const createQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, author, category } = req.body;

    if (!text || !author) {
      res.status(400).json({ 
        status: 'error',
        message: 'Câmpurile "text" și "author" sunt obligatorii.' 
      });
      return;
    }

    const insertQuery = `
      INSERT INTO quotes (text, author, category)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [text, author, category || null];

    const result = await query(insertQuery, values);
    
    const newQuote: Quote = result.rows[0];

    res.status(201).json({
      status: 'success',
      message: 'Citat adăugat cu succes!',
      data: newQuote
    });

  } catch (error) {
    console.error('[Eroare Controller] Nu s-a putut crea citatul:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Eroare internă a serverului la adăugarea citatului.' 
    });
  }
};
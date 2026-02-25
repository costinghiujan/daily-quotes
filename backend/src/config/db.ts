import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
});

pool.on('error', (err: any, client: any) => {
  console.error('[Eroare Bază de Date] Eroare neașteptată în fundal:', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`[Bază de Date] Conexiune reușită la PostgreSQL. Timp server DB: ${res.rows[0].now}`);
  } catch (err) {
    console.error('[Eroare Bază de Date] Nu s-a putut conecta la PostgreSQL:', err);
    throw err;
  }
};

export const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      author VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('[Bază de Date] Tabela "quotes" este pregătită și validată.');
  } catch (error) {
    console.error('[Eroare Bază de Date] Nu s-a putut inițializa tabela "quotes":', error);
    throw error;
  }
};
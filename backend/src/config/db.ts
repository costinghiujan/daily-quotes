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
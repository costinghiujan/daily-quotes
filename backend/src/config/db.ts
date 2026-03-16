import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[Bază de Date] Conexiune reușită la PostgreSQL. Timp server DB:', res.rows[0].now);
  } catch (error) {
    console.error('[Eroare Bază de Date] Conexiunea a eșuat:', error);
    throw error;
  }
};

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN expo_push_token VARCHAR(255);
    `);
    console.log('[Bază de Date] Tabela "users" este pregătită.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Bază de Date] Tabela "quotes" este pregătită.');

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
    `);
    console.log('[Bază de Date] Tabela "users" a fost extinsă cu profilul social.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requester_id, receiver_id)
      );
    `);
    console.log('[Bază de Date] Tabela "friendships" este pregătită.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Bază de Date] Tabela "sessions" este pregătită.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quote_reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        reaction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- ARHITECTURĂ NOUĂ: Permitem reacții multiple, dar prevenim duplicatele de același tip
        CONSTRAINT unique_user_quote_reaction UNIQUE (user_id, quote_id, reaction_type)
      );
    `);
    console.log('[Bază de Date] Tabela "quote_reactions" este pregătită.');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_quote_id ON quote_reactions(quote_id);
    `);
    console.log('[Bază de Date] Indexul "idx_reactions_quote_id" este pregătit.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        notify_reactions BOOLEAN DEFAULT TRUE,
        notify_friend_requests BOOLEAN DEFAULT TRUE,
        notify_friend_accepted BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Bază de Date] Tabela "notification_settings" este pregătită.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- ex: 'REACTION_ADDED', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED'
        reference_id INTEGER, -- ID-ul citatului sau al cererii de prietenie (polimorfism ușor)
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Bază de Date] Tabela "notifications" este pregătită.');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
    `);
    console.log('[Bază de Date] Indexul "idx_notifications_recipient" este pregătit.');

  } catch (error) {
    console.error('[Eroare Bază de Date] Inițializarea tabelelor a eșuat:', error);
    throw error;
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
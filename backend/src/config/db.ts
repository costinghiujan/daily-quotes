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
    console.log('[Bază de Date] Conexiune reușită la PostgreSQL. Timp server:', res.rows[0].now);
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
        full_name VARCHAR(100),
        bio TEXT,
        profile_picture_url TEXT,
        expo_push_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quote_reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        reaction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_quote_reaction UNIQUE (user_id, quote_id, reaction_type)
      );
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_reactions_quote_id ON quote_reactions(quote_id);`,
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        notify_reactions BOOLEAN DEFAULT TRUE,
        notify_comments BOOLEAN DEFAULT TRUE,
        notify_friend_requests BOOLEAN DEFAULT TRUE,
        notify_friend_accepted BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        reference_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);`,
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_quote_id ON comments(quote_id);`);

    console.log('[Bază de Date] Toate tabelele și indecșii sunt inițializați cu succes.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT, -- Am eliminat NOT NULL pentru a permite mesaje exclusiv media
        message_type VARCHAR(20) DEFAULT 'TEXT', -- Poate fi: TEXT, IMAGE, DOCUMENT
        media_url TEXT, -- Calea sau URL-ul către fișier
        file_name VARCHAR(255), -- Numele original al documentului (ex: contract.pdf)
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await pool.query(`ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'TEXT';`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);`);
      console.log('[Bază de Date] Migrarea tabelei "messages" a rulat cu succes.');
    } catch (migError) {
      console.log('[Bază de Date] Notă migrare messages:', migError);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id)
      );
    `);

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);`,
    );
  } catch (error) {
    console.error('[Eroare Bază de Date] Inițializarea tabelelor a eșuat:', error);
    throw error;
  }
};

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

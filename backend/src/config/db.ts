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
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_daily_prompt_date DATE,
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
        streak_count INTEGER DEFAULT 0,
        last_interaction_date TIMESTAMP,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT,
        message_type VARCHAR(20) DEFAULT 'TEXT',
        media_url TEXT,
        file_name VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    try {
      await pool.query(`ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'TEXT';`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;`);
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);`);
      
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_prompt_date DATE;`);
      
      await pool.query(`ALTER TABLE friendships ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;`);
      await pool.query(`ALTER TABLE friendships ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP;`);
      
      console.log('[Bază de Date] Toate migrările pe tabelele vechi au rulat cu succes.');
    } catch (migError) {
      console.log('[Bază de Date] Notă migrare (posibil rulezi o bază de date proaspătă):', migError);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        icon_name VARCHAR(50) NOT NULL,
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INTEGER NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_id)
      );
    `);

    await pool.query(`
      INSERT INTO badges (name, description, icon_name, requirement_type, requirement_value)
      VALUES 
        ('Scriitor Începător', 'Ai adăugat primele 5 citate.', 'pencil', 'QUOTES_COUNT', 5),
        ('Social Butterfly', 'Ai adunat 10 prieteni.', 'people', 'FRIENDS_COUNT', 10),
        ('Critic Literar', 'Ai lăsat 10 comentarii pe platformă.', 'chatbubbles', 'COMMENTS_COUNT', 10),
        ('Trendsetter', 'Un citat de-al tău a primit 50 de aprecieri.', 'star', 'QUOTE_LIKES', 50)
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('[Bază de Date] Tabelele de Gamificare și Insignele au fost inițializate cu succes.');

  } catch (error) {
    console.error('[Eroare Bază de Date] Inițializarea tabelelor a eșuat:', error);
    throw error;
  }
};

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
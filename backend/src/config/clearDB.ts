import { pool } from './db';

const clearDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('--- 🧹 ÎNCEPERE GOLIRE BAZĂ DE DATE ---');
    await client.query('BEGIN');
    
    await client.query(
      'TRUNCATE users, quotes, friendships, quote_reactions, comments, notifications, notification_settings, user_badges, blocks, messages RESTART IDENTITY CASCADE',
    );
    
    await client.query('COMMIT');
    console.log('--- ✅ BAZA DE DATE A FOST GOLITĂ CU SUCCES ---');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Eroare la golirea bazei de date:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

clearDatabase();
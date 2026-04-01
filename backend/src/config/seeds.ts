import bcrypt from 'bcrypt';
import { pool } from './db';

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('--- 🧹 GOLIRE BAZĂ DE DATE ---');
    await client.query('BEGIN');
    await client.query('TRUNCATE users, quotes, friendships, quote_reactions, comments, notifications, notification_settings, user_badges, blocks RESTART IDENTITY CASCADE');
    
    console.log('--- 👤 CREARE 5 CONTURI DE TEST ---');
    const userIds: number[] = [];
    const saltRounds = 10;

    for (let i = 1; i <= 5; i++) {
      const username = `test${i}`;
      const passwordHash = await bcrypt.hash(`test${i}`, saltRounds);
      
      const xp = i * 45;
      const level = Math.floor(xp / 50) + 1;

      const userRes = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [username, `${username}@test.com`, passwordHash, `User Test ${i}`, `Sunt utilizatorul de test numărul ${i}.`, xp, level]
      );
      const uid = userRes.rows[0].id;
      userIds.push(uid);

      await client.query('INSERT INTO notification_settings (user_id) VALUES ($1)', [uid]);
    }

    console.log('--- 📝 ADĂUGARE CITATE ---');
    const quoteIds: number[] = [];
    const categories = ['Motivațional', 'Filozofie', 'Iubire', 'Succes'];
    
    for (const uid of userIds) {
      const res = await client.query(
        `INSERT INTO quotes (text, author, category, user_id) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [`Acesta este un citat inspirațional de la user ${uid} #test #inspiratie`, `Autor ${uid}`, categories[uid % 4], uid]
      );
      quoteIds.push(res.rows[0].id);
    }

    console.log('--- 🤝 CREARE RELAȚII (PRIETENII & BLOCĂRI) ---');
    await client.query(`INSERT INTO friendships (requester_id, receiver_id, status, streak_count, last_interaction_date) VALUES 
      ($1, $2, 'accepted', 5, NOW()), 
      ($1, $3, 'accepted', 12, NOW())`, [userIds[0], userIds[1], userIds[2]]);
    
    await client.query(`INSERT INTO friendships (requester_id, receiver_id, status) VALUES ($1, $2, 'pending')`, [userIds[3], userIds[0]]);

    await client.query(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [userIds[0], userIds[4]]);

    console.log('--- ❤️ ADĂUGARE REACȚII ȘI COMENTARII ---');
    const firstQuoteId = quoteIds[0];
    for (let i = 1; i < userIds.length; i++) {
      await client.query(
        `INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3)`,
        [userIds[i], firstQuoteId, 'BLUE_HEART']
      );
      await client.query(
        `INSERT INTO comments (text, user_id, quote_id) VALUES ($1, $2, $3)`,
        ['Un comentariu foarte interesant!', userIds[i], firstQuoteId]
      );
    }

    console.log('--- 🏅 ACORDARE INSIGNE ---');
    await client.query(`INSERT INTO user_badges (user_id, badge_id) VALUES ($1, 1)`, [userIds[0]]);

    await client.query('COMMIT');
    console.log('--- ✅ SEED COMPLETAT CU SUCCES ---');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Eroare la seed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

seedDatabase();
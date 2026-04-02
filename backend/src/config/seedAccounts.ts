import bcrypt from 'bcrypt';
import { pool } from './db';

const seedAccounts = async () => {
  const client = await pool.connect();
  try {
    console.log('--- 👤 ÎNCEPERE CREARE 10 CONTURI DE TEST ---');
    await client.query('BEGIN');
    
    const saltRounds = 10;

    for (let i = 1; i <= 10; i++) {
      const username = `test${i}`;
      const passwordHash = await bcrypt.hash(username, saltRounds);

      const userRes = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [
          username,
          `${username}@test.com`,
          passwordHash,
          `Utilizator Test ${i}`,
          `Acesta este contul de test numărul ${i}.`,
          0, 
          1,
        ]
      );

      if (userRes.rows.length > 0) {
        const uid = userRes.rows[0].id;
        await client.query(
          'INSERT INTO notification_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', 
          [uid]
        );
        console.log(`✅ Cont creat cu succes: ${username}`);
      } else {
        console.log(`⚠️ Contul ${username} exista deja și a fost sărit.`);
      }
    }

    await client.query('COMMIT');
    console.log('--- ✅ CONTURILE AU FOST CREATE CU SUCCES ---');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Eroare la crearea conturilor:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

seedAccounts();
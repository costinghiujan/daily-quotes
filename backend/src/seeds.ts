import bcrypt from 'bcrypt';
import { pool } from './config/db';

const seedUsers = async () => {
  try {
    console.log('[Seed] Începem generarea celor 9 conturi mock...');

    for (let i = 1; i <= 9; i++) {
      const username = `test${i}`;
      const email = `test${i}@gmail.com`;
      const password = `test${i}`;
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userResult = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [username, email, passwordHash, `Test User ${i}`]
      );

      if (userResult.rows.length > 0) {
        const newUserId = userResult.rows[0].id;

        await pool.query(
          `INSERT INTO notification_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [newUserId]
        );
        console.log(`✅ Cont creat cu succes: ${username} (ID: ${newUserId})`);
      } else {
        console.log(`⚠️ Contul ${username} există deja în baza de date.`);
      }
    }

    console.log('[Seed] Generarea a fost finalizată! Poți șterge acest fișier.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Eroare fatală:', error);
    process.exit(1);
  }
};

seedUsers();
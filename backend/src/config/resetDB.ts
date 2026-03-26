import { pool } from './db';

const resetDatabase = async () => {
  try {
    console.log('⏳ Începe procesul de ștergere a tabelelor...');

    await pool.query(`
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS notification_settings CASCADE;
      DROP TABLE IF EXISTS quote_reactions CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS friendships CASCADE;
      DROP TABLE IF EXISTS quotes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('✅ Baza de date a fost curățată complet!');
    console.log('La următoarea pornire a serverului, tabelele vor fi recreate cu schema nouă.');
  } catch (error) {
    console.error('❌ Eroare la curățarea bazei de date:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

resetDatabase();

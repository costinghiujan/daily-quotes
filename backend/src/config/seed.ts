import bcrypt from 'bcrypt';
import { pool, initDB } from './db';
import { aiService } from '../services/aiService';

interface ZenQuote {
  q: string;
  a: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const seedMassive = async () => {
  try {
    console.log('\n--- 🏗️  PREGĂTIRE MEDIU BAZĂ DE DATE ---');
    await initDB();
    
    const client = await pool.connect();
    
    try {
      console.log('--- 🚀 PORNIRE PROCES SEED (10 UTILIZATORI x 10 CITATE) ---');
      await client.query('BEGIN');
      
      const saltRounds = 10;
      const userIds: number[] = [];

      console.log('👥 Creare conturi de test...');
      for (let i = 1; i <= 10; i++) {
        const username = `user${i}`;
        const passwordHash = await bcrypt.hash(username, saltRounds);
        
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (username) DO NOTHING 
           RETURNING id`,
          [username, `${username}@test.com`, passwordHash, `Utilizator ${i}`, `Pasionat de citate diverse și AI.`]
        );
        
        if (res.rows.length > 0) {
          userIds.push(res.rows[0].id);
        } else {
          const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
          userIds.push(existing.rows[0].id);
        }
      }

      console.log('🌐 Descărcare citate reale de la ZenQuotes...');
      const allQuotes: ZenQuote[] = [];
      const totalToFetch = 100;
      const batchSize = 50;

      for (let i = 0; i < totalToFetch / batchSize; i++) {
        process.stdout.write(`   📥 Batch ${i + 1}/${totalToFetch / batchSize}... `);
        const response = await fetch('https://zenquotes.io/api/quotes');
        if (!response.ok) throw new Error('Nu s-a putut contacta API-ul ZenQuotes.');
        
        const data = (await response.json()) as ZenQuote[];
        allQuotes.push(...data);
        console.log('Terminat');
        await delay(2000);
      }

      console.log('\n--- 🧠 CLASIFICARE SEMANTICĂ ȘI INSERARE ---');
      
      for (let i = 0; i < allQuotes.length; i++) {
        const q = allQuotes[i];
        const currentUserId = userIds[i % 10]; // Distribuție uniformă: 10 per user

        const generatedTags = await aiService.generateTags(q.q);

        console.log(`[${i + 1}/100] 👤 ${q.a.padEnd(20)} | 📜 "${q.q.substring(0, 50)}..."`);
        console.log(`      🏷️  Hashtags AI: ${generatedTags.map(t => `\x1b[36m#${t}\x1b[0m`).join(' ')}`);
        console.log('\x1b[2m-------------------------------------------------------------------\x1b[0m');

        const finalTagsString = generatedTags.map(t => `#${t}`).join(' ');
        const textWithTags = `${q.q} ${finalTagsString}`;
        await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' hours')::interval)`,
          [textWithTags, q.a, generatedTags[0] || 'General', currentUserId, generatedTags, i]
        );

        if (i % 5 === 0) await delay(200);
      }

      await client.query('COMMIT');
      console.log('\n✅ SEED FINALIZAT CU SUCCES! 100 de citate etichetate de AI sunt gata.');

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('\n❌ EROARE FATALĂ LA SEED:', error);
  } finally {
    process.exit(0);
  }
};

seedMassive();
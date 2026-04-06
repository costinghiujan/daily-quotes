import { pool } from './db';
import { aiService } from '../services/aiService';

const backfillEmbeddings = async () => {
  const client = await pool.connect();
  try {
    console.log('--- 🧠 ÎNCEPERE VECTORIZARE CITATE (BACKFILL) ---');

    const result = await client.query(
      `SELECT id, text, author, category FROM quotes WHERE embedding IS NULL`,
    );
    const quotes = result.rows;

    if (quotes.length === 0) {
      console.log('✅ Nu există citate fără vectori. Totul este la zi!');
      process.exit(0);
    }

    console.log(`⏳ S-au găsit ${quotes.length} citate fără vectori. Pornim motorul Ollama...`);
    console.log(`(Acest proces va dura câteva secunde/minute, în funcție de procesorul tău)`);

    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i];
      const contextForAI = `Citat: ${q.text} | Autor: ${q.author} | Categorie: ${q.category}`;

      process.stdout.write(`[${i + 1}/${quotes.length}] Procesare citat ID ${q.id}... `);

      const embeddingArray = await aiService.getEmbedding(contextForAI);

      if (embeddingArray) {
        const embeddingString = `[${embeddingArray.join(',')}]`;
        await client.query(`UPDATE quotes SET embedding = $1 WHERE id = $2`, [
          embeddingString,
          q.id,
        ]);
        console.log('OK');
      } else {
        console.log('Eroare (Verifică dacă Ollama rulează)');
      }
    }

    console.log('--- ✅ VECTORIZARE COMPLETĂ! TOATE CITATELE AU "CREIER" ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Eroare la backfill:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

backfillEmbeddings();

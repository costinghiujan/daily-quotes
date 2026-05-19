import bcrypt from 'bcrypt';
import { pool, initDB } from './db';
import { aiService } from '../services/aiService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mainUsersData = [
  { username: 'alex_muresan', fullName: 'Alex Mureșan', bio: 'Pasionat de filosofie și minimalism. Caut mereu sensul în cuvinte simple.' },
  { username: 'elena_popescu', fullName: 'Elena Popescu', bio: 'Iubesc arta și citatele motivaționale. Cred că fiecare zi merită un gând bun.' },
  { username: 'vlad_ionescu', fullName: 'Vlad Ionescu', bio: 'Dezvoltator software, cititor pasionat și tech enthusiast. Inspirația vine din cod și cărți.' }
];

const reactionUsersData = [
  { username: 'ana_maria', fullName: 'Ana Maria' },
  { username: 'cristi_neagu', fullName: 'Cristi Neagu' },
  { username: 'laura_dan', fullName: 'Laura Dan' },
  { username: 'mihai_vasile', fullName: 'Mihai Vasile' },
  { username: 'andreea_g', fullName: 'Andreea Georgescu' },
  { username: 'stefan_radu', fullName: 'Stefan Radu' },
  { username: 'dana_ionescu', fullName: 'Dana Ionescu' },
  { username: 'radu_popa', fullName: 'Radu Popa' },
  { username: 'ioana_m', fullName: 'Ioana Marin' },
  { username: 'gabriel_stan', fullName: 'Gabriel Stan' }
];

const quotesData = [
  { text: "Singurul mod de a face lucruri grozave este să iubești ceea ce faci.", author: "Steve Jobs", category: "Motivație" },
  { text: "Nu contează cât de încet mergi, atâta timp cât nu te oprești.", author: "Confucius", category: "Înțelepciune" },
  { text: "Viața este ceea ce se întâmplă în timp ce îți faci alte planuri.", author: "John Lennon", category: "Viață" },
  { text: "Fericirea nu este ceva gata făcut. Ea vine din propriile tale acțiuni.", author: "Dalai Lama", category: "Fericire" },
  { text: "Crede că poți și ești deja la jumătatea drumului.", author: "Theodore Roosevelt", category: "Încredere" },
  { text: "Viitorul aparține celor care cred în frumusețea viselor lor.", author: "Eleanor Roosevelt", category: "Visuri" },
  { text: "Cea mai mare glorie nu stă în faptul că nu cădem niciodată, ci în faptul că ne ridicăm după fiecare cădere.", author: "Nelson Mandela", category: "Reziliență" },
  { text: "Succesul nu este final, eșecul nu este fatal: curajul de a continua este cel care contează.", author: "Winston Churchill", category: "Succes" },
  { text: "Fii schimbarea pe care vrei să o vezi în lume.", author: "Mahatma Gandhi", category: "Schimbare" },
  { text: "În mijlocul dificultăților se află oportunitățile.", author: "Albert Einstein", category: "Oportunitate" }
];

const commentTemplates = [
  "Foarte adevărat! Mulțumesc pentru postare.",
  "Inspirațional, chiar aveam nevoie de asta azi.",
  "Un citat care te pune pe gânduri.",
  "Absolut superb! ❤️",
  "Mi-a schimbat perspectiva asupra zilei de azi.",
  "Wow, ce profunzime în aceste cuvinte.",
  "Exact așa simt și eu!",
  "O lecție de viață importantă.",
  "Cât de mult adevăr într-o singură propoziție.",
  "Superb! Recomand tuturor să citească asta."
];

const reactionTypes = ['like', 'love', 'insightful', 'bravo'];

const seedMassive = async () => {
  try {
    console.log('\n--- 🏗️ PREGĂTIRE MEDIU BAZĂ DE DATE ---');
    await initDB();
    const client = await pool.connect();

    try {
      console.log('--- 🧹 CURĂȚARE BAZĂ DE DATE ---');
      await client.query('BEGIN');
      await client.query('TRUNCATE users, quotes, friendships, quote_reactions, comments, notifications, notification_settings, user_badges, blocks, messages RESTART IDENTITY CASCADE');

      const saltRounds = 10;
      const mainUserIds: number[] = [];
      const reactionUserIds: number[] = [];

      console.log('👥 Creare utilizatori principali...');
      for (const u of mainUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName, u.bio, Math.floor(Math.random() * 500), Math.floor(Math.random() * 5) + 1]
        );
        mainUserIds.push(res.rows[0].id);
      }

      console.log('👥 Creare utilizatori de reacție...');
      for (const u of reactionUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName, `Utilizator pasionat de citate.`]
        );
        reactionUserIds.push(res.rows[0].id);
      }

      console.log('🤝 Creare prietenii între utilizatorii principali...');
      for (let i = 0; i < mainUserIds.length; i++) {
        for (let j = i + 1; j < mainUserIds.length; j++) {
          await client.query(
            `INSERT INTO friendships (requester_id, receiver_id, status, streak_count, last_interaction_date) 
             VALUES ($1, $2, 'accepted', $3, NOW())`,
            [mainUserIds[i], mainUserIds[j], Math.floor(Math.random() * 10)]
          );
        }
      }

      console.log('📜 Inserare citate și interacțiuni...');
      const quoteIds: number[] = [];
      for (let i = 0; i < quotesData.length; i++) {
        const q = quotesData[i];
        const ownerId = mainUserIds[i % mainUserIds.length];
        
        console.log(`   [${i + 1}/${quotesData.length}] ✍️ ${mainUsersData[i % mainUserIds.length].fullName} a postat: "${q.text.substring(0, 30)}..."`);

        const tags = await aiService.generateTags(q.text);
        const embedding = await aiService.getEmbedding(q.text);

        const res = await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, embedding, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval) 
           RETURNING id`,
          [q.text, q.author, q.category, ownerId, tags, embedding ? `[${embedding.join(',')}]` : null, i * 2]
        );
        const quoteId = res.rows[0].id;
        quoteIds.push(quoteId);

        // Adaugă reacții de la utilizatorii de reacție
        const numReactions = Math.floor(Math.random() * 6) + 4; // 4-10 reacții
        const shuffledReactors = [...reactionUserIds].sort(() => 0.5 - Math.random());
        for (let j = 0; j < numReactions; j++) {
          const reactorId = shuffledReactors[j];
          const type = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
          await client.query(
            `INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [reactorId, quoteId, type]
          );
        }

        // Adaugă comentarii de la utilizatorii principali
        const otherMainUsers = mainUserIds.filter(id => id !== ownerId);
        for (const commentatorId of otherMainUsers) {
          if (Math.random() > 0.3) { // 70% șansă de comentariu între prieteni
            const commentText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
            await client.query(
              `INSERT INTO comments (text, user_id, quote_id) VALUES ($1, $2, $3)`,
              [commentText, commentatorId, quoteId]
            );
          }
        }

        // Adaugă câteva comentarii de la utilizatorii de reacție
        const numComments = Math.floor(Math.random() * 3); // 0-2 comentarii extra
        for (let j = 0; j < numComments; j++) {
          const reactorId = reactionUserIds[Math.floor(Math.random() * reactionUserIds.length)];
          const commentText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
          await client.query(
            `INSERT INTO comments (text, user_id, quote_id) VALUES ($1, $2, $3)`,
            [commentText, reactorId, quoteId]
          );
        }

        if (i % 3 === 0) await delay(100);
      }

      await client.query('COMMIT');
      console.log('\n✅ SEED FINALIZAT CU SUCCES! Baza de date conține acum o simulare realistă de interacțiuni.');

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
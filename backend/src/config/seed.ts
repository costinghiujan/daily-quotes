import bcrypt from 'bcrypt';
import { pool, initDB } from './db';
import { aiService } from '../services/aiService';

const thermalCooldown = (ms: number, reason: string): Promise<void> => {
  console.log(`      ⏳ Pauză sistem: ${reason} (${ms / 1000} secunde)...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Exact 6 utilizatori pentru o rețea controlată
const mainUsersData = [
  { username: 'alex_stoicul', fullName: 'Alexandru M.', bio: 'Pasionat de filosofie și minimalism.' }, // Face parte din grup
  { username: 'elena_p', fullName: 'Elena Popescu', bio: 'Iubesc arta și citatele motivaționale.' },    // Face parte din grup
  { username: 'vlad_dev', fullName: 'Vlad Ionescu', bio: 'Programator și cititor pasionat.' },        // Face parte din grup
  { username: 'ana_singuratica', fullName: 'Ana Maria', bio: 'Caut liniștea în singurătate.' },       // IZOLAT 1
  { username: 'mihai_lupul', fullName: 'Mihai Vasile', bio: 'Lup singuratic. Fără prieteni.' },       // IZOLAT 2
  { username: 'laura_d', fullName: 'Laura Dan', bio: 'Doar eu și gândurile mele de dimineață.' }      // Prieten doar cu Alex
];

// Câțiva utilizatori "fantomă" doar pentru a da reacții la postări (să nu fie feed-ul gol)
const reactionUsersData = [
  { username: 'cititor_1', fullName: 'Cititor Pasionat' },
  { username: 'cititor_2', fullName: 'Omul cu Like-uri' },
  { username: 'cititor_3', fullName: 'Vizitator Anonim' }
];

// Exact 30 de citate diverse
const quotesData = [
  // Citate pentru Alex (Stoicism)
  { text: "Nu evenimentele în sine ne tulbură, ci modul în care le interpretăm și judecăm.", author: "Epictet", category: "Stoicism" },
  { text: "Ai putere asupra minții tale, nu asupra evenimentelor exterioare.", author: "Marcus Aurelius", category: "Stoicism" },
  { text: "Suferim mai des în imaginație decât în realitate.", author: "Seneca", category: "Stoicism" },
  { text: "Nu te lăsa copleșit de întregul vieții tale. Rămâi la prezent.", author: "Marcus Aurelius", category: "Stoicism" },
  { text: "Ceea ce depinde de tine este voința ta; restul e dat sorții.", author: "Epictet", category: "Stoicism" },

  // Citate pentru Elena (Motivație)
  { text: "Singurul mod de a face lucruri grozave este să iubești ceea ce faci.", author: "Steve Jobs", category: "Motivație" },
  { text: "Cea mai mare glorie nu stă în faptul că nu cădem niciodată, ci în faptul că ne ridicăm.", author: "Nelson Mandela", category: "Reziliență" },
  { text: "Fii schimbarea pe care vrei să o vezi în lume.", author: "Mahatma Gandhi", category: "Schimbare" },
  { text: "Nu contează cât de încet mergi, atâta timp cât nu te oprești.", author: "Confucius", category: "Motivație" },
  { text: "În mijlocul dificultăților se află oportunitățile.", author: "Albert Einstein", category: "Motivație" },

  // Citate pentru Vlad (Anxietate și Focus)
  { text: "Frica ucide mintea. Frica este moartea măruntă.", author: "Frank Herbert", category: "Anxietate" },
  { text: "Anxietatea este amețeala libertății.", author: "Søren Kierkegaard", category: "Anxietate" },
  { text: "Nu îți face griji pentru lucrurile pe care nu le poți controla.", author: "Epictet", category: "Anxietate" },
  { text: "Viața este ceea ce se întâmplă în timp ce îți faci alte planuri.", author: "John Lennon", category: "Viață" },
  { text: "Cea mai mare greșeală este să te temi continuu că o vei face.", author: "Elbert Hubbard", category: "Anxietate" },

  // Citate pentru Ana (Melancolie / Izolat 1)
  { text: "Melancolia este fericirea de a fi trist.", author: "Victor Hugo", category: "Melancolie" },
  { text: "Durerea este prețul pe care îl plătim pentru iubire.", author: "Regina Elisabeta a II-a", category: "Tristețe" },
  { text: "Lacrimile sunt cuvintele pe care inima nu le poate rosti.", author: "Gerard Way", category: "Tristețe" },
  { text: "Uneori trebuie să atingi fundul oceanului pentru a aprecia aerul.", author: "Sylvia Plath", category: "Melancolie" },
  { text: "Sunt nopți în care lupii sunt tăcuți și doar luna urlă.", author: "George Carlin", category: "Tristețe" },

  // Citate pentru Mihai (Singurătate / Izolat 2)
  { text: "Singurătatea este soarta tuturor spiritelor excelente.", author: "Arthur Schopenhauer", category: "Singurătate" },
  { text: "Nu mi-a fost niciodată frică de singurătate. Spațiul gol m-a hrănit.", author: "Charles Bukowski", category: "Singurătate" },
  { text: "Să fii singur este un lucru frumos dacă știi cum să îți ții companie.", author: "Tanya Masse", category: "Singurătate" },
  { text: "În singurătate, omul descoperă ceea ce mulțimea a ascuns.", author: "Anonim", category: "Introspecție" },
  { text: "Cel mai puternic om din lume este cel care stă cel mai mult singur.", author: "Henrik Ibsen", category: "Singurătate" },

  // Citate pentru Laura (Dimineață)
  { text: "Când te trezești dimineața, gândește-te ce privilegiu este să fii în viață.", author: "Marcus Aurelius", category: "Dimineață" },
  { text: "Fiecare dimineață ne naștem din nou.", author: "Buddha", category: "Dimineață" },
  { text: "Aerul dimineții are secrete pe care vrea să ți le spună. Nu adormi la loc.", author: "Rumi", category: "Dimineață" },
  { text: "Zâmbește-i dimineții, chiar dacă ziua îți promite furtuni.", author: "Anonim", category: "Dimineață" },
  { text: "Nimeni nu a sărăcit vreodată dăruind.", author: "Anne Frank", category: "Empatie" }
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

      console.log('👥 Creare cei 6 utilizatori principali...');
      for (const u of mainUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName, u.bio, Math.floor(Math.random() * 200), Math.floor(Math.random() * 3) + 1]
        );
        mainUserIds.push(res.rows[0].id);
      }

      console.log('👥 Creare utilizatori fantomă (pentru like-uri)...');
      for (const u of reactionUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName]
        );
        reactionUserIds.push(res.rows[0].id);
      }

      console.log('🤝 Generare Prietenii conform cerințelor...');
      // mainUserIds index: 0=Alex, 1=Elena, 2=Vlad, 3=Ana (Izolat), 4=Mihai (Izolat), 5=Laura

      const addFriend = async (id1: number, id2: number) => {
        await client.query(
          `INSERT INTO friendships (requester_id, receiver_id, status, streak_count, last_interaction_date) VALUES ($1, $2, 'accepted', $3, NOW())`,
          [mainUserIds[id1], mainUserIds[id2], Math.floor(Math.random() * 10) + 1]
        );
      };

      // 1. Grupul de 3 prieteni (Alex, Elena, Vlad) sunt prieteni între ei
      await addFriend(0, 1);
      await addFriend(1, 2);
      await addFriend(0, 2);

      // 2. Ana (3) și Mihai (4) rămân IZOLAȚI. Nu rulăm niciun addFriend pentru ei.

      // 3. Laura (5) este prietenă doar cu Alex (0)
      await addFriend(0, 5);
      console.log('   -> Rețea creată: Grup de 3, 2 Izolați complet, 1 Conexiune unică.');

      console.log(`\n🧠 START PROCESARE CITATE SECVENȚIAL (Câte 1 pe rând)`);
      
      for (let i = 0; i < quotesData.length; i++) {
        const q = quotesData[i];
        
        // Alocăm exact 5 citate fiecărui utilizator:
        // i de la 0 la 4 merg la user 0. i de la 5 la 9 merg la user 1, etc.
        const ownerIndex = Math.floor(i / 5); 
        const ownerId = mainUserIds[ownerIndex];
        
        console.log(`\n[${i + 1}/30] ✍️ ${mainUsersData[ownerIndex].username} a postat un citat.`);
        
        let tags: string[] = ['general'];
        let embedding: number[] | null = null;

        try {
          // Pas 1: Llama3 pentru Hashtag-uri
          console.log(`      -> Extragere hashtag-uri (Llama3)...`);
          tags = await aiService.generateTags(q.text);
          await thermalCooldown(4000, "Eliberare memorie Llama3");

          // Pas 2: Nomic pentru Vectori
          console.log(`      -> Generare vectori (Nomic)...`);
          embedding = await aiService.getEmbedding(q.text);
          await thermalCooldown(2000, "Răcire procesor");
        } catch (aiError) {
          console.log(`      ⚠️ Eroare la AI, citatul va fi salvat fără vectori pentru a continua.`);
        }

        // Pas 3: Salvare în baza de date
        const res = await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, embedding, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval) RETURNING id`,
          [q.text, q.author, q.category, ownerId, tags, embedding ? `[${embedding.join(',')}]` : null, i]
        );
        const quoteId = res.rows[0].id;

        // Adăugăm 1-3 reacții aleatorii de la utilizatorii fantomă
        const numReactions = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numReactions; j++) {
          await client.query(`INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [reactionUserIds[j], quoteId, reactionTypes[Math.floor(Math.random() * reactionTypes.length)]]);
        }

        // Dacă s-a terminat un utilizator (din 5 în 5 citate), luăm o pauză mare
        if ((i + 1) % 5 === 0 && (i + 1) !== quotesData.length) {
          console.log(`\n   ✅ Utilizatorul ${mainUsersData[ownerIndex].username} și-a terminat postările.`);
          await thermalCooldown(8000, "Pauză majoră între utilizatori");
        }
      }

      await client.query('COMMIT');
      console.log('\n✅ SEED FINALIZAT CU SUCCES! Aplicația este gata pentru testare.');

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
import bcrypt from 'bcrypt';
import { pool, initDB } from './db';
import { aiService } from '../services/aiService';

// Funcție pentru prevenirea supraîncălzirii și eliberarea memoriei
const thermalCooldown = (ms: number, reason: string): Promise<void> => {
  console.log(`      ⏳ Pauză sistem: ${reason} (${ms / 1000} secunde)...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Exact 6 utilizatori pentru o rețea controlată
const mainUsersData = [
  { username: 'alex_stoicul', fullName: 'Alexandru M.', bio: 'Passionate about philosophy and minimalism.' }, 
  { username: 'elena_p', fullName: 'Elena Popescu', bio: 'I love art and motivational quotes.' },    
  { username: 'vlad_dev', fullName: 'Vlad Ionescu', bio: 'Software developer and avid reader.' },        
  { username: 'ana_singuratica', fullName: 'Ana Maria', bio: 'Seeking peace in solitude.' },       
  { username: 'mihai_lupul', fullName: 'Mihai Vasile', bio: 'Lone wolf. No friends.' },       
  { username: 'laura_d', fullName: 'Laura Dan', bio: 'Just me and my morning thoughts.' }      
];

// Câțiva utilizatori "fantomă" doar pentru a da reacții la postări
const reactionUsersData = [
  { username: 'cititor_1', fullName: 'Avid Reader' },
  { username: 'cititor_2', fullName: 'The Liker' },
  { username: 'cititor_3', fullName: 'Anonymous Visitor' }
];

// Exact 30 de citate diverse, traduse în engleză pentru acuratețe maximă la vectorizare
const quotesData = [
  // Citate pentru Alex (Stoicism)
  { text: "Men are disturbed not by things, but by the view which they take of them.", author: "Epictetus", category: "Stoicism" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "Stoicism" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism" },
  { text: "Do not let the panorama of your life oppress you. Stick to the present.", author: "Marcus Aurelius", category: "Stoicism" },
  { text: "Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion.", author: "Epictetus", category: "Stoicism" },

  // Citate pentru Elena (Motivație)
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", category: "Resilience" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Change" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Motivation" },

  // Citate pentru Vlad (Anxietate și Focus)
  { text: "I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.", author: "Frank Herbert", category: "Anxiety" },
  { text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard", category: "Anxiety" },
  { text: "There is only one way to happiness and that is to cease worrying about things which are beyond the power of our will.", author: "Epictetus", category: "Anxiety" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
  { text: "The greatest mistake you can make in life is to be continually fearing you will make one.", author: "Elbert Hubbard", category: "Anxiety" },

  // Citate pentru Ana (Melancolie / Izolat 1)
  { text: "Melancholy is the happiness of being sad.", author: "Victor Hugo", category: "Melancholy" },
  { text: "Grief is the price we pay for love.", author: "Queen Elizabeth II", category: "Sadness" },
  { text: "Tears are words the heart can't express.", author: "Gerard Way", category: "Sadness" },
  { text: "I think I must go down to the bottom of the sea to appreciate the beauty of the air.", author: "Sylvia Plath", category: "Melancholy" },
  { text: "Those are the same stars, and that is the same moon, that look down upon your brothers and sisters.", author: "Sojourner Truth", category: "Sadness" },

  // Citate pentru Mihai (Singurătate / Izolat 2)
  { text: "A man can be himself only so long as he is alone.", author: "Arthur Schopenhauer", category: "Loneliness" },
  { text: "I've never been lonely. I've been in a room - I've felt suicidal. I've been depressed. But I never felt that nobody could cure my loneliness.", author: "Charles Bukowski", category: "Loneliness" },
  { text: "To be alone is a beautiful thing if you know how to keep yourself company.", author: "Tanya Masse", category: "Loneliness" },
  { text: "In solitude, the mind gains strength and learns to lean upon itself.", author: "Laurence Sterne", category: "Introspection" },
  { text: "The strongest men are the most alone.", author: "Henrik Ibsen", category: "Loneliness" },

  // Citate pentru Laura (Dimineață)
  { text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius", category: "Morning" },
  { text: "Every morning we are born again. What we do today is what matters most.", author: "Buddha", category: "Morning" },
  { text: "The morning breeze has secrets to tell you. Do not go back to sleep.", author: "Rumi", category: "Morning" },
  { text: "Smile at the morning, even if the day promises storms.", author: "Anonymous", category: "Morning" },
  { text: "No one has ever become poor by giving.", author: "Anne Frank", category: "Empathy" }
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

      const addFriend = async (id1: number, id2: number) => {
        await client.query(
          `INSERT INTO friendships (requester_id, receiver_id, status, streak_count, last_interaction_date) VALUES ($1, $2, 'accepted', $3, NOW())`,
          [mainUserIds[id1], mainUserIds[id2], Math.floor(Math.random() * 10) + 1]
        );
      };

      // 1. Grupul de 3 prieteni (Alex, Elena, Vlad)
      await addFriend(0, 1);
      await addFriend(1, 2);
      await addFriend(0, 2);

      // 2. Ana (3) și Mihai (4) rămân IZOLAȚI

      // 3. Laura (5) este prietenă doar cu Alex (0)
      await addFriend(0, 5);
      console.log('   -> Rețea creată: Grup de 3, 2 Izolați complet, 1 Conexiune unică.');

      // Debug: Enable badges for Ana (ana_singuratica, index 3)
      console.log('🏅 Activare badge-uri pentru Ana (debug)...');
      const anaUserId = mainUserIds[3];
      // Badge IDs: Săptămâna 1 (STREAK_MILESTONE 7), Influencer (QUOTE_LIKES 100), Vorbăreț (COMMENTS_COUNT 50)
      const anaBadges = await client.query(
        `SELECT id, name FROM badges WHERE name IN ('Săptămâna 1', 'Influencer', 'Vorbăreț')`
      );
      for (const badge of anaBadges.rows) {
        await client.query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [anaUserId, badge.id]
        );
        console.log(`   ✅ Badge "${badge.name}" (ID ${badge.id}) acordat utilizatoarei ana_singuratica.`);
      }

      console.log(`\n🧠 START PROCESARE CITATE SECVENȚIAL (Cu protecție termică activă)`);
      
      for (let i = 0; i < quotesData.length; i++) {
        const q = quotesData[i];
        
        // Alocăm exact 5 citate fiecărui utilizator
        const ownerIndex = Math.floor(i / 5); 
        const ownerId = mainUserIds[ownerIndex];
        
        console.log(`\n[${i + 1}/30] ✍️ ${mainUsersData[ownerIndex].username} a postat un citat.`);
        
        let tags: string[] = ['general'];
        let embedding: number[] | null = null;

        try {
          console.log(`      -> Extragere hashtag-uri (Llama3)...`);
          tags = await aiService.generateTags(q.text);
          await thermalCooldown(4000, "Eliberare memorie Llama3");

          console.log(`      -> Generare vectori (Nomic)...`);
          embedding = await aiService.getEmbedding(q.text);
          await thermalCooldown(2000, "Răcire procesor");
        } catch {
          console.log(`      ⚠️ Eroare la AI, citatul va fi salvat fără vectori pentru a continua.`);
        }

        const res = await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, embedding, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval) RETURNING id`,
          [q.text, q.author, q.category, ownerId, tags, embedding ? `[${embedding.join(',')}]` : null, i]
        );
        const quoteId = res.rows[0].id;

        const numReactions = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numReactions; j++) {
          await client.query(`INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [reactionUserIds[j], quoteId, reactionTypes[Math.floor(Math.random() * reactionTypes.length)]]);
        }

        if ((i + 1) % 5 === 0 && (i + 1) !== quotesData.length) {
          console.log(`   ✅ Utilizatorul ${mainUsersData[ownerIndex].username} și-a terminat postările.`);
          await thermalCooldown(10000, "Pauză majoră între utilizatori");
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
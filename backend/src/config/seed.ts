import bcrypt from 'bcrypt';
import { pool, initDB } from './db';
import { aiService } from '../services/aiService';

// Funcție pentru prevenirea supraîncălzirii și eliberarea memoriei
const thermalCooldown = (ms: number, reason: string): Promise<void> => {
  console.log(`      ⏳ Pauză sistem: ${reason} (${ms / 1000} secunde)...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 10 Utilizatori pentru o acoperire semantică totală
const mainUsersData = [
  { username: 'alex_stoicul', fullName: 'Alexandru M.', bio: 'Logic and control over emotions.' }, 
  { username: 'elena_motivat', fullName: 'Elena Popescu', bio: 'Hustle, grind, and success.' },    
  { username: 'vlad_anxios', fullName: 'Vlad Ionescu', bio: 'Overthinker fighting daily dread.' },        
  { username: 'ana_trista', fullName: 'Ana Maria', bio: 'Drowning in sorrow and memories.' },       
  { username: 'mihai_izolat', fullName: 'Mihai Vasile', bio: 'Total isolation. Rejecting society.' },       
  { username: 'laura_bucurie', fullName: 'Laura Dan', bio: 'Sunlight, morning coffee, and smiles.' },
  { username: 'radu_explorator', fullName: 'Radu Marin', bio: 'Mountains, forests, and wild adventures.' },
  { username: 'carmen_iubire', fullName: 'Carmen T.', bio: 'Soulmates, romance, and deep connections.' },
  { username: 'sorin_zen', fullName: 'Sorin P.', bio: 'Mindfulness, breathing, and absolute peace.' },
  { username: 'diana_furie', fullName: 'Diana R.', bio: 'Betrayal, burning rage, and revenge.' }
];

const reactionUsersData = [
  { username: 'cititor_1', fullName: 'Avid Reader' },
  { username: 'cititor_2', fullName: 'The Liker' },
  { username: 'cititor_3', fullName: 'Anonymous Visitor' }
];

// 80 Citate structurate pe clustere semantice puternice
const quotesData = [
  // --- CLUSTER 1: STOICISM (Logică, Control, Minte) -> alex_stoicul ---
  { owner: 'alex_stoicul', text: "Men are disturbed not by things, but by the view which they take of them.", author: "Epictetus", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "Objective judgment, now, at this very moment. Unselfish action, now, at this very moment.", author: "Marcus Aurelius", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "No person has the power to have everything they want, but it is in their power not to want what they don't have.", author: "Seneca", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "Stoicism" },
  { owner: 'alex_stoicul', text: "He who fears death will never do anything worth of a man who is alive.", author: "Seneca", category: "Stoicism" },

  // --- CLUSTER 2: MOTIVAȚIE (Acțiune, Succes, Energie) -> elena_motivat ---
  { owner: 'elena_motivat', text: "The only way to do great work is to love what you do. Keep pushing forward.", author: "Steve Jobs", category: "Motivation" },
  { owner: 'elena_motivat', text: "Grind while they sleep. Learn while they party. Live like they dream.", author: "Unknown", category: "Hustle" },
  { owner: 'elena_motivat', text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Motivation" },
  { owner: 'elena_motivat', text: "Don't stop when you're tired. Stop when you're done. Conquer your goals.", author: "David Goggins", category: "Motivation" },
  { owner: 'elena_motivat', text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action" },
  { owner: 'elena_motivat', text: "Opportunities don't happen, you create them through hard work and discipline.", author: "Chris Grosser", category: "Hustle" },
  { owner: 'elena_motivat', text: "The future belongs to those who believe in the beauty of their ambitions.", author: "Eleanor Roosevelt", category: "Motivation" },
  { owner: 'elena_motivat', text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson", category: "Success" },

  // --- CLUSTER 3: ANXIETATE / FRICĂ (Panică, Umbre, Teroare) -> vlad_anxios ---
  { owner: 'vlad_anxios', text: "I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.", author: "Frank Herbert", category: "Fear" },
  { owner: 'vlad_anxios', text: "Anxiety is the dizziness of freedom, a terrifying look into the abyss of choices.", author: "Søren Kierkegaard", category: "Anxiety" },
  { owner: 'vlad_anxios', text: "The oldest and strongest emotion of mankind is fear, and the oldest and strongest kind of fear is fear of the unknown.", author: "H.P. Lovecraft", category: "Fear" },
  { owner: 'vlad_anxios', text: "My brain is a crowded room where everyone is screaming and the walls are closing in.", author: "Unknown", category: "Panic" },
  { owner: 'vlad_anxios', text: "I am paralyzed by the shadows of tomorrow, anticipating catastrophes that haven't even happened.", author: "Unknown", category: "Anxiety" },
  { owner: 'vlad_anxios', text: "Worry does not empty tomorrow of its sorrow, it empties today of its strength.", author: "Corrie ten Boom", category: "Worry" },
  { owner: 'vlad_anxios', text: "There is a dread that lives in the chest, a heavy stone that makes every breath a battle.", author: "Unknown", category: "Dread" },
  { owner: 'vlad_anxios', text: "We are more often frightened than hurt; and we suffer more from imagination than from reality.", author: "Seneca", category: "Fear" },

  // --- CLUSTER 4: TRISTEȚE / DOLIU (Lacrimi, Pierdere, Durere) -> ana_trista ---
  { owner: 'ana_trista', text: "Grief is the price we pay for love. It shatters the heart into a million irreparable pieces.", author: "Queen Elizabeth II", category: "Grief" },
  { owner: 'ana_trista', text: "Tears are words the heart can't express. Heavy drops of an endless sorrow.", author: "Gerard Way", category: "Sadness" },
  { owner: 'ana_trista', text: "Melancholy is the happiness of being sad, a dark comforting blanket over the soul.", author: "Victor Hugo", category: "Melancholy" },
  { owner: 'ana_trista', text: "The pain I feel now is the happiness I had before. That's the deal.", author: "C.S. Lewis", category: "Loss" },
  { owner: 'ana_trista', text: "It’s so hard to forget pain, but it’s even harder to remember sweetness. We have no scar to show for happiness.", author: "Chuck Palahniuk", category: "Pain" },
  { owner: 'ana_trista', text: "Every time it rains, I feel the sky is weeping for the memories I can no longer hold.", author: "Unknown", category: "Sorrow" },
  { owner: 'ana_trista', text: "A million words would not bring you back, I know because I tried. Neither would a million tears.", author: "Unknown", category: "Grief" },
  { owner: 'ana_trista', text: "There is an ocean of silence between us, and I am drowning in it.", author: "Unknown", category: "Sadness" },

  // --- CLUSTER 5: SINGURĂTATE / IZOLARE (Vid, Absență, Singur) -> mihai_izolat ---
  { owner: 'mihai_izolat', text: "A man can be himself only so long as he is alone. Society is a prison of masks.", author: "Arthur Schopenhauer", category: "Loneliness" },
  { owner: 'mihai_izolat', text: "I've never been lonely. I've been in a room — I've felt suicidal. But I never felt that nobody could cure my loneliness.", author: "Charles Bukowski", category: "Isolation" },
  { owner: 'mihai_izolat', text: "The strongest men are the most alone. They stand in the void and require no validation.", author: "Henrik Ibsen", category: "Solitude" },
  { owner: 'mihai_izolat', text: "I am entirely alone, surrounded by a world that does not understand the language of my silence.", author: "Unknown", category: "Alienation" },
  { owner: 'mihai_izolat', text: "Whosoever is delighted in solitude is either a wild beast or a god.", author: "Aristotle", category: "Solitude" },
  { owner: 'mihai_izolat', text: "Loneliness adds beauty to life. It puts a special burn on sunsets and makes night air smell better.", author: "Henry Rollins", category: "Loneliness" },
  { owner: 'mihai_izolat', text: "I exist in a vacuum. A phantom walking through crowds, unseen and untouched.", author: "Unknown", category: "Isolation" },
  { owner: 'mihai_izolat', text: "Hell is other people. I prefer the quiet emptiness of an empty room.", author: "Jean-Paul Sartre", category: "Isolation" },

  // --- CLUSTER 6: BUCURIE / DIMINEAȚĂ (Lumină, Zâmbete, Soare) -> laura_bucurie ---
  { owner: 'laura_bucurie', text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius", category: "Morning" },
  { owner: 'laura_bucurie', text: "The morning breeze has secrets to tell you. The sun brings warm hugs and bright smiles.", author: "Rumi", category: "Joy" },
  { owner: 'laura_bucurie', text: "Every morning we are born again. Joy is a choice, and today I choose to shine.", author: "Buddha", category: "Happiness" },
  { owner: 'laura_bucurie', text: "Keep your face to the sunshine and you cannot see a shadow.", author: "Helen Keller", category: "Positivity" },
  { owner: 'laura_bucurie', text: "A simple smile can illuminate the darkest room and bring warmth to a cold heart.", author: "Unknown", category: "Joy" },
  { owner: 'laura_bucurie', text: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson", category: "Optimism" },
  { owner: 'laura_bucurie', text: "Happiness is a warm cup of coffee and the golden rays of dawn kissing your face.", author: "Unknown", category: "Morning" },
  { owner: 'laura_bucurie', text: "Let your joy burst forth like flowers in the spring.", author: "Unknown", category: "Happiness" },

  // --- CLUSTER 7: NATURĂ / AVENTURĂ (Sălbăticie, Explorare, Munți) -> radu_explorator ---
  { owner: 'radu_explorator', text: "The mountains are calling and I must go. The wilderness is my true home.", author: "John Muir", category: "Nature" },
  { owner: 'radu_explorator', text: "Not all those who wander are lost. Some are just looking for the edge of the world.", author: "J.R.R. Tolkien", category: "Adventure" },
  { owner: 'radu_explorator', text: "To travel, to experience and learn: that is to live. The compass is my only master.", author: "Tenzing Norgay", category: "Exploration" },
  { owner: 'radu_explorator', text: "Look deep into nature, and then you will understand everything better.", author: "Albert Einstein", category: "Nature" },
  { owner: 'radu_explorator', text: "A ship in harbor is safe, but that is not what ships are built for. Set sail into the storm.", author: "John A. Shedd", category: "Adventure" },
  { owner: 'radu_explorator', text: "In every walk with nature one receives far more than he seeks.", author: "John Muir", category: "Nature" },
  { owner: 'radu_explorator', text: "The ocean stirs the heart, inspires the imagination and brings eternal joy to the soul.", author: "Robert Wyland", category: "Exploration" },
  { owner: 'radu_explorator', text: "Wilderness is not a luxury but a necessity of the human spirit.", author: "Edward Abbey", category: "Nature" },

  // --- CLUSTER 8: IUBIRE / ROMANTISM (Suflet, Pasiune, Îmbrățișare) -> carmen_iubire ---
  { owner: 'carmen_iubire', text: "I love you as certain dark things are to be loved, in secret, between the shadow and the soul.", author: "Pablo Neruda", category: "Love" },
  { owner: 'carmen_iubire', text: "Whatever our souls are made of, his and mine are the same. A fierce, burning passion.", author: "Emily Brontë", category: "Romance" },
  { owner: 'carmen_iubire', text: "Doubt thou the stars are fire; Doubt that the sun doth move; Doubt truth to be a liar; But never doubt I love.", author: "William Shakespeare", category: "Love" },
  { owner: 'carmen_iubire', text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott", category: "Romance" },
  { owner: 'carmen_iubire', text: "You are the last thought in my mind before I drift off to sleep and the first thought when I wake.", author: "Unknown", category: "Love" },
  { owner: 'carmen_iubire', text: "A kiss is a lovely trick designed by nature to stop speech when words become superfluous.", author: "Ingrid Bergman", category: "Passion" },
  { owner: 'carmen_iubire', text: "We loved with a love that was more than love.", author: "Edgar Allan Poe", category: "Romance" },
  { owner: 'carmen_iubire', text: "If I had a flower for every time I thought of you, I could walk through my garden forever.", author: "Alfred Tennyson", category: "Love" },

  // --- CLUSTER 9: ZEN / LINIȘTE (Respirație, Prezent, Calmitate) -> sorin_zen ---
  { owner: 'sorin_zen', text: "Smile, breathe and go slowly. The present moment is the only moment available to us.", author: "Thich Nhat Hanh", category: "Zen" },
  { owner: 'sorin_zen', text: "Nature does not hurry, yet everything is accomplished. Flow like water.", author: "Lao Tzu", category: "Mindfulness" },
  { owner: 'sorin_zen', text: "Empty your mind, be formless, shapeless — like water. Find absolute stillness.", author: "Bruce Lee", category: "Zen" },
  { owner: 'sorin_zen', text: "Peace comes from within. Do not seek it without. Rest in the quiet of your own being.", author: "Buddha", category: "Peace" },
  { owner: 'sorin_zen', text: "To a mind that is still, the whole universe surrenders.", author: "Lao Tzu", category: "Mindfulness" },
  { owner: 'sorin_zen', text: "Meditation is not evasion; it is a serene encounter with reality.", author: "Thich Nhat Hanh", category: "Zen" },
  { owner: 'sorin_zen', text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese Proverb", category: "Peace" },
  { owner: 'sorin_zen', text: "Let go of the battle. Breathe quietly and let it be. Let go.", author: "Jack Kornfield", category: "Mindfulness" },

  // --- CLUSTER 10: FURIE / TRĂDARE (Venin, Răzbunare, Ură) -> diana_furie ---
  { owner: 'diana_furie', text: "For every betrayal, there is a burning fire of vengeance that cannot be quenched by apologies.", author: "Unknown", category: "Anger" },
  { owner: 'diana_furie', text: "Anger is a hot coal that you hold in your hand while waiting to throw it at someone else.", author: "Buddha", category: "Anger" },
  { owner: 'diana_furie', text: "The knife of betrayal cuts the deepest, leaving a toxic venom in the blood of trust.", author: "Unknown", category: "Betrayal" },
  { owner: 'diana_furie', text: "I will not forgive, and I will not forget. The ashes of my trust will choke my enemies.", author: "Unknown", category: "Revenge" },
  { owner: 'diana_furie', text: "Speak when you are angry and you will make the best speech you will ever regret.", author: "Ambrose Bierce", category: "Rage" },
  { owner: 'diana_furie', text: "It is easier to forgive an enemy than to forgive a friend who stabbed you in the back.", author: "William Blake", category: "Betrayal" },
  { owner: 'diana_furie', text: "A quick temper will make a fool of you soon enough, but the slow burn of resentment destroys the soul.", author: "Bruce Lee", category: "Anger" },
  { owner: 'diana_furie', text: "I am fueled by the disrespect. Watch me burn the bridges and let the fire light my way.", author: "Unknown", category: "Rage" }
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
      // Mapă dinamică pentru a asocia rapid username -> id (DRY approach)
      const userIdsMap = new Map<string, number>();
      const reactionUserIds: number[] = [];

      console.log(`👥 Creare cei ${mainUsersData.length} utilizatori principali...`);
      for (const u of mainUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName, u.bio, Math.floor(Math.random() * 200), Math.floor(Math.random() * 3) + 1]
        );
        userIdsMap.set(u.username, res.rows[0].id);
      }

      console.log('👥 Creare utilizatori fantomă (pentru reacții)...');
      for (const u of reactionUsersData) {
        const passwordHash = await bcrypt.hash(u.username, saltRounds);
        const res = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id`,
          [u.username, `${u.username}@example.com`, passwordHash, u.fullName]
        );
        reactionUserIds.push(res.rows[0].id);
      }

      console.log('🤝 Generare Prietenii controlate...');

      const addFriend = async (user1: string, user2: string) => {
        const id1 = userIdsMap.get(user1);
        const id2 = userIdsMap.get(user2);
        if(!id1 || !id2) return;
        
        await client.query(
          `INSERT INTO friendships (requester_id, receiver_id, status, streak_count, last_interaction_date) VALUES ($1, $2, 'accepted', $3, NOW())`,
          [id1, id2, Math.floor(Math.random() * 10) + 1]
        );
      };

      // Creăm câteva insule sociale specifice
      await addFriend('alex_stoicul', 'elena_motivat');
      await addFriend('elena_motivat', 'vlad_anxios');
      await addFriend('radu_explorator', 'laura_bucurie');
      await addFriend('carmen_iubire', 'sorin_zen');
      // ana_trista, mihai_izolat și diana_furie rămân fără prieteni pentru testare algoritm de explore "la rece"
      
      console.log('   -> Rețea creată cu succes.');

      console.log(`\n🧠 START PROCESARE CITATE SECVENȚIAL (${quotesData.length} citate total)`);
      
      for (let i = 0; i < quotesData.length; i++) {
        const q = quotesData[i];
        
        // Căutare dinamică a owner-ului (robust Error Handling)
        const ownerId = userIdsMap.get(q.owner);
        if (!ownerId) {
          console.error(`      ❌ Eroare: Nu am găsit ID pentru userul ${q.owner}`);
          continue;
        }
        
        console.log(`\n[${i + 1}/${quotesData.length}] ✍️ ${q.owner} postează...`);
        
        let tags: string[] = [q.category.toLowerCase()];
        let embedding: number[] | null = null;

        try {
          console.log(`      -> Extragere hashtag-uri (Llama3)...`);
          const generatedTags = await aiService.generateTags(q.text);
          if (generatedTags && generatedTags.length > 0) tags = generatedTags;
          await thermalCooldown(3000, "Eliberare memorie Llama3");

          console.log(`      -> Generare vectori Nomic (768D)...`);
          embedding = await aiService.getEmbedding(q.text);
          await thermalCooldown(2000, "Răcire procesor inferență");
        } catch (error) {
          console.log(`      ⚠️ Eroare AI. Salvăm citatul cu fallback pentru a preveni blocajul.`);
        }

        const res = await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, embedding, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval) RETURNING id`,
          [q.text, q.author, q.category, ownerId, tags, embedding ? `[${embedding.join(',')}]` : null, i]
        );
        const quoteId = res.rows[0].id;

        // Generare reacții aleatorii
        const numReactions = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numReactions; j++) {
          await client.query(
            `INSERT INTO quote_reactions (user_id, quote_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, 
            [reactionUserIds[j], quoteId, reactionTypes[Math.floor(Math.random() * reactionTypes.length)]]
          );
        }

        // Pauză majoră după fiecare calup de 8 citate (un utilizator complet)
        if ((i + 1) % 8 === 0 && (i + 1) !== quotesData.length) {
          console.log(`\n   ✅ Utilizatorul ${q.owner} și-a terminat postările.`);
          await thermalCooldown(8000, "Pauză majoră de răcire GPU/CPU între utilizatori");
        }
      }

      await client.query('COMMIT');
      console.log('\n✅ SEED MASIV FINALIZAT CU SUCCES! Spațiul vectorial este pregătit pentru testele K-NN.');

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
import bcrypt from 'bcrypt';
import { pool, initDB } from './db';

const extractHashtags = (text: string): string[] => {
  const matches = text.match(/#[\w\u0590-\u05ff]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.substring(1).toLowerCase()))];
};

const seedAccounts = async () => {
  try {
    console.log('--- 🏗️ INIȚIALIZARE STRUCTURĂ BAZĂ DE DATE ---');
    await initDB();

    const client = await pool.connect();
    try {
      console.log('--- 👤 ÎNCEPERE CREARE 5 CONTURI ȘI CONȚINUT TEMATIC ---');
      await client.query('BEGIN');

      const saltRounds = 10;
      const userIds: number[] = [];

      for (let i = 1; i <= 5; i++) {
        const username = `test${i}`;
        const passwordHash = await bcrypt.hash(username, saltRounds);

        let bio = '';
        if (i === 1) bio = 'Pasionat de stoicism și filozofie antică. Caut liniștea interioară.';
        if (i === 2) bio = 'Antreprenor. Motivație zilnică și mindset de învingător. 🚀';
        if (i === 3) bio = 'Iubitor de artă, poezie și frumos. Răspândesc iubire.';
        if (i === 4) bio = 'Tech geek. Inovație și viitor. 💻';
        if (i === 5) bio = 'Citesc din toate domeniile. Un pic din fiecare.';

        const userRes = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio, xp, level) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (username) DO NOTHING
           RETURNING id`,
          [username, `${username}@test.com`, passwordHash, `Utilizator Test ${i}`, bio, 0, 1],
        );

        if (userRes.rows.length > 0) {
          const uid = userRes.rows[0].id;
          userIds.push(uid);
          await client.query(
            'INSERT INTO notification_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
            [uid],
          );
          console.log(`✅ Cont creat cu succes: ${username}`);
        } else {
          console.log(`⚠️ Contul ${username} exista deja. Vezi dacă trebuie să rulezi db:clear.`);
        }
      }

      if (userIds.length !== 5) {
        throw new Error(
          'Nu s-au putut crea toți cei 5 utilizatori. Oprește și rulează npm run db:clear.',
        );
      }

      const quotesData = [
        {
          text: 'Ai putere asupra minții tale, nu asupra evenimentelor exterioare. Realizează asta și vei găsi puterea. #stoicism #mindset #putere',
          author: 'Marcus Aurelius',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Nu ne tulbură lucrurile în sine, ci judecățile noastre despre ele. #epictet #gandire #stoicism',
          author: 'Epictet',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Suferim mai mult din imaginație decât din realitate. #seneca #frica #realitate',
          author: 'Seneca',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Fericirea vieții tale depinde de calitatea gândurilor tale. #fericire #ganduri #marcusAurelius',
          author: 'Marcus Aurelius',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Dacă vrei să fii fericit, fii. #simplitate #tolstoy #viata',
          author: 'Lev Tolstoi',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Singura adevărată înțelepciune este să știi că nu știi nimic. #socrates #adevar #cunoastere',
          author: 'Socrate',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Un om care suferă înainte de a fi necesar, suferă mai mult decât este necesar. #anxietate #seneca #stoicism',
          author: 'Seneca',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Examinează-te pe tine însuți, nu pe alții. #introspectie #stoicism #dezvoltare',
          author: 'Marcus Aurelius',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Norocul este ceea ce se întâmplă când pregătirea întâlnește oportunitatea. #noroc #pregatire #seneca',
          author: 'Seneca',
          category: 'Filozofie',
          userIdx: 0,
        },
        {
          text: 'Viața este scurtă. Fă din ea ceva extraordinar. #viata #scop #filozofie',
          author: 'Anonim',
          category: 'Filozofie',
          userIdx: 0,
        },

        {
          text: 'Succesul nu este final, eșecul nu este fatal: curajul de a continua este ceea ce contează. #succes #curaj #motivatie',
          author: 'Winston Churchill',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Nu te opri când ești obosit. Oprește-te când ai terminat. #munca #disciplina #motivatie',
          author: 'David Goggins',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Singurul mod de a face o muncă extraordinară este să iubești ceea ce faci. #cariera #pasiune #succes',
          author: 'Steve Jobs',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Dacă treci prin iad, continuă să mergi. #rezilienta #putere #mindset',
          author: 'Winston Churchill',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Oportunitățile nu se întâmplă, tu le creezi. #oportunitate #succes #business',
          author: 'Chris Grosser',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Nu număra zilele, fă zilele să conteze. #timp #motivatie #actiune',
          author: 'Muhammad Ali',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Cea mai bună răzbunare este un succes masiv. #succes #ambitie #motivatie',
          author: 'Frank Sinatra',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Disciplina este puntea dintre obiective și realizări. #disciplina #obiective #succes',
          author: 'Jim Rohn',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Riscul vine din a nu ști ce faci. #risc #investitii #mindset',
          author: 'Warren Buffett',
          category: 'Motivațional',
          userIdx: 1,
        },
        {
          text: 'Secretul pentru a merge înainte este să începi. #inceput #actiune #motivatie',
          author: 'Mark Twain',
          category: 'Motivațional',
          userIdx: 1,
        },

        {
          text: 'Unde există iubire, există viață. #iubire #viata #ganduri',
          author: 'Mahatma Gandhi',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Iubirea este compusă dintr-un singur suflet care locuiește în două corpuri. #suflet #aristotel #iubire',
          author: 'Aristotel',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Suntem modelați și formați de ceea ce iubim. #iubire #caracter #poezie',
          author: 'Johann Wolfgang von Goethe',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'A iubi nu înseamnă a te uita unul la celălalt, ci a privi amândoi în aceeași direcție. #relatii #cuplu #iubire',
          author: 'Antoine de Saint-Exupéry',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Dacă știu ce este dragostea, este din cauza ta. #romantism #dragoste #emotii',
          author: 'Hermann Hesse',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Lasă-te atras în tăcere de forța ciudată a ceea ce iubești cu adevărat. #pasiune #rumi #suflet',
          author: 'Rumi',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'O inimă care iubește este întotdeauna tânără. #inima #tinerete #iubire',
          author: 'Proverb Grecesc',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Nu iubești o persoană pentru că este perfectă, o iubești în ciuda faptului că nu este. #imperfectiune #dragoste #relatii',
          author: 'Jodi Picoult',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Fericirea supremă a vieții este convingerea că suntem iubiți. #fericire #iubire #victorHugo',
          author: 'Victor Hugo',
          category: 'Iubire',
          userIdx: 2,
        },
        {
          text: 'Dragostea este poezia simțurilor. #poezie #simturi #dragoste',
          author: 'Honoré de Balzac',
          category: 'Iubire',
          userIdx: 2,
        },

        {
          text: 'Inovația distinge un lider de un urmăritor. #inovatie #leadership #tech',
          author: 'Steve Jobs',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Tehnologia este cel mai bun atunci când îi aduce pe oameni împreună. #oameni #tehnologie #conexiune',
          author: 'Matt Mullenweg',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Software-ul mănâncă lumea. #software #viitor #tech',
          author: 'Marc Andreessen',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Cea mai mare amenințare la adresa planetei noastre este credința că altcineva o va salva. #planeta #viitor #actiune',
          author: 'Robert Swan',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Știința de azi este tehnologia de mâine. #stiinta #inovatie #tehnologie',
          author: 'Edward Teller',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Orice tehnologie suficient de avansată este imposibil de distins de magie. #magie #clarke #viitor',
          author: 'Arthur C. Clarke',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Dacă vrei să înțelegi viitorul, trebuie să creezi viitorul. #creativitate #viitor #tech',
          author: 'Elon Musk',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Inteligența este capacitatea de a te adapta la schimbare. #inteligenta #schimbare #stephenHawking',
          author: 'Stephen Hawking',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Eșecul este o opțiune aici. Dacă lucrurile nu eșuează, nu inovezi suficient. #esec #inovatie #elonMusk',
          author: 'Elon Musk',
          category: 'Tehnologie',
          userIdx: 3,
        },
        {
          text: 'Designul nu este doar cum arată și cum se simte. Designul este cum funcționează. #design #functionalitate #tech',
          author: 'Steve Jobs',
          category: 'Tehnologie',
          userIdx: 3,
        },

        {
          text: 'Viața este ca mersul pe bicicletă. Pentru a-ți menține echilibrul, trebuie să continui să te miști. #echilibru #viata #einstein',
          author: 'Albert Einstein',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Nu am eșuat. Am găsit doar 10.000 de moduri care nu funcționează. #perseverenta #edison #inventii',
          author: 'Thomas Edison',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Cea mai bună cale de a prezice viitorul este de a-l inventa. #viitor #creativitate #actiune',
          author: 'Alan Kay',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'În mijlocul dificultăților se ascunde oportunitatea. #dificultate #oportunitate #einstein',
          author: 'Albert Einstein',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Arta spală din suflet praful vieții de zi cu zi. #arta #suflet #picasso',
          author: 'Pablo Picasso',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Fii tu însuți; toți ceilalți sunt deja luați. #autenticitate #oscarWilde #viata',
          author: 'Oscar Wilde',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Muzica este limbajul universal al omenirii. #muzica #limbaj #oameni',
          author: 'Henry Wadsworth Longfellow',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Călătoriile te lasă fără cuvinte, apoi te transformă într-un povestitor. #calatorii #povesti #explorare',
          author: 'Ibn Battuta',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Râsul este cel mai bun medicament. #ras #sanatate #bucurie',
          author: 'Proverb',
          category: 'Diverse',
          userIdx: 4,
        },
        {
          text: 'Fii blând, pentru că toți cei pe care îi întâlnești duc o luptă grea. #empatie #bunatate #oameni',
          author: 'Platon',
          category: 'Diverse',
          userIdx: 4,
        },
      ];

      console.log('--- 📝 ADĂUGARE CITATE ȘI HASHTAG-URI ---');

      for (let i = 0; i < quotesData.length; i++) {
        const q = quotesData[i];
        const tags = extractHashtags(q.text);
        const uId = userIds[q.userIdx];

        const timeOffset = `${i * 2} HOURS`;

        await client.query(
          `INSERT INTO quotes (text, author, category, user_id, hashtags, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${timeOffset}')`,
          [q.text, q.author, q.category, uId, tags],
        );
      }

      await client.query('COMMIT');
      console.log('--- ✅ SEED COMPLET! BAZELE PENTRU MOTORUL DE RECOMANDARE SUNT PUSE! ---');
    } catch (innerError) {
      await client.query('ROLLBACK');
      throw innerError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Eroare la seed:', error);
  } finally {
    process.exit(0);
  }
};

seedAccounts();

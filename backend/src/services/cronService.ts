import cron from 'node-cron';
import { query } from '../config/db';
import { sendPushNotification } from './expoPushService';

const EMOTION_LABELS: Record<string, { ro: string; en: string }> = {
  motivational: { ro: 'Motivațional', en: 'Motivational' },
  inspirational: { ro: 'Inspirațional', en: 'Inspirational' },
  funny: { ro: 'Amuzant', en: 'Funny' },
  philosophical: { ro: 'Filozofic', en: 'Philosophical' },
  romantic: { ro: 'Romantic', en: 'Romantic' },
  sad: { ro: 'Trist', en: 'Sad' },
  calm: { ro: 'Calm', en: 'Calm' },
  energetic: { ro: 'Energic', en: 'Energetic' },
};

const EMOTION_HASHTAGS: Record<string, string[]> = {
  motivational: ['#motivation', '#inspiration', '#success'],
  inspirational: ['#inspiration', '#hope', '#dreams'],
  funny: ['#funny', '#humor', '#laugh'],
  philosophical: ['#philosophy', '#wisdom', '#life'],
  romantic: ['#love', '#romance', '#heart'],
  sad: ['#sad', '#melancholy', '#heartbreak'],
  calm: ['#calm', '#peace', '#serenity'],
  energetic: ['#energy', '#power', '#strength'],
};

async function sendScheduledNotifications() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const result = await query(
      `SELECT sn.id, sn.user_id, sn.emotion, sn.hour, sn.minute, u.expo_push_token
       FROM scheduled_notifications sn
       JOIN users u ON sn.user_id = u.id
       WHERE sn.is_active = TRUE
         AND sn.hour = $1
         AND sn.minute = $2`,
      [currentHour, currentMinute],
    );

    if (result.rows.length === 0) return;

    for (const row of result.rows) {
      if (!row.expo_push_token) continue;

      const emotionLabel = EMOTION_LABELS[row.emotion]?.ro || row.emotion;
      const hashtags = EMOTION_HASHTAGS[row.emotion] || [];

      // Find a random quote matching the emotion's hashtags
      let quoteText = '';

      if (hashtags.length > 0) {
        const quoteResult = await query(
          `SELECT text, author FROM quotes 
           WHERE hashtags && $1 
           ORDER BY RANDOM() 
           LIMIT 1`,
          [hashtags],
        );

        if (quoteResult.rows.length > 0) {
          const q = quoteResult.rows[0];
          quoteText = `"${q.text}" — ${q.author}`;
        }
      }

      // Fallback if no matching quote found
      if (!quoteText) {
        const fallbackResult = await query(
          `SELECT text, author FROM quotes ORDER BY RANDOM() LIMIT 1`,
        );
        if (fallbackResult.rows.length > 0) {
          const q = fallbackResult.rows[0];
          quoteText = `"${q.text}" — ${q.author}`;
        } else {
          quoteText = '„Singurul mod de a face o treabă grozavă este să iubești ceea ce faci.” — Steve Jobs';
        }
      }

      await sendPushNotification(
        row.expo_push_token,
        `☀️ Citat ${emotionLabel}`,
        quoteText,
        { type: 'SCHEDULED_QUOTE', emotion: row.emotion, scheduledNotificationId: row.id },
      );

      console.log(`[Cron] Notificare programată trimisă utilizatorului ${row.user_id} (emoție: ${row.emotion})`);
    }
  } catch (error) {
    console.error('[Eroare Cron] Trimitere notificări programate:', error);
  }
}

export const initCronJobs = () => {
  // Run every minute to check for scheduled notifications
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] ⏰ Verific notificări programate...');
    await sendScheduledNotifications();
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] 🌙 Începe mentenanța automată de la miezul nopții...');

    try {
      const resetStreaksResult = await query(`
        UPDATE friendships 
        SET streak_count = 0 
        WHERE last_interaction_date < NOW() - INTERVAL '48 HOURS'
          AND streak_count > 0
        RETURNING id;
      `);
      console.log(`[Cron] 🔥 S-au resetat ${resetStreaksResult.rows.length} flăcări expirate.`);

      const cleanupNotifications = await query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 DAYS';
      `);
      console.log(`[Cron] 🧹 S-au șters ${cleanupNotifications.rows.length} notificări vechi.`);

      const cleanupSessions = await query(`
        DELETE FROM sessions 
        WHERE created_at < NOW() - INTERVAL '60 DAYS';
      `);
      console.log(`[Cron] 🧹 S-au curățat ${cleanupSessions.rows.length} sesiuni inactive.`);
    } catch (error) {
      console.error('[Eroare Cron] Mentenanța de noapte a eșuat:', error);
    }
  });

  console.log('[Cron] Serviciul de task-uri programate a fost inițializat cu succes.');
};

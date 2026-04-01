import cron from 'node-cron';
import { query } from '../config/db';

export const initCronJobs = () => {
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
      console.log(`[Cron] 🔥 S-au resetat ${resetStreaksResult.rowCount} flăcări expirate.`);

      const cleanupNotifications = await query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 DAYS';
      `);
      console.log(`[Cron] 🧹 S-au șters ${cleanupNotifications.rowCount} notificări vechi.`);

      const cleanupSessions = await query(`
        DELETE FROM sessions 
        WHERE created_at < NOW() - INTERVAL '60 DAYS';
      `);
      console.log(`[Cron] 🧹 S-au curățat ${cleanupSessions.rowCount} sesiuni inactive.`);
    } catch (error) {
      console.error('[Eroare Cron] Mentenanța de noapte a eșuat:', error);
    }
  });

  console.log('[Cron] Serviciul de task-uri programate a fost inițializat cu succes.');
};

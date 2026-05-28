import { query } from '../config/db';

export const XP_VALUES = {
  ADD_QUOTE: 10,
  ADD_COMMENT: 5,
  ADD_REACTION: 2,
  DAILY_PROMPT: 20,
  DAILY_LOGIN: 5,
};

export const GamificationService = {
  async addXp(
    userId: number,
    xpAmount: number,
  ): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
    try {
      const userRes = await query('SELECT xp, level FROM users WHERE id = $1', [userId]);

      if (userRes.rows.length === 0) {
        throw new Error('Utilizatorul nu a fost găsit.');
      }

      const currentXp = userRes.rows[0].xp || 0;
      const currentLevel = userRes.rows[0].level || 1;

      const newXp = currentXp + xpAmount;

      const calculatedLevel = Math.floor(newXp / 50) + 1;

      const leveledUp = calculatedLevel > currentLevel;

      await query('UPDATE users SET xp = $1, level = $2 WHERE id = $3', [
        newXp,
        calculatedLevel,
        userId,
      ]);

      if (leveledUp) {
        console.log(
          `[Gamification] Utilizatorul ${userId} a crescut la nivelul ${calculatedLevel}! 🥳`,
        );
      }

      return { newXp, newLevel: calculatedLevel, leveledUp };
    } catch (error) {
      console.error('[Eroare GamificationService] Nu s-a putut adăuga XP:', error);
      throw error;
    }
  },

  /**
   * Track daily login streak for a user.
   * Awards DAILY_LOGIN XP and checks streak milestone badges.
   * Returns streak info for the frontend.
   */
  async trackDailyLogin(
    userId: number,
  ): Promise<{ daily_streak: number; streak_bonus: number; xp_awarded: number }> {
    try {
      const userRes = await query(
        'SELECT last_active_date, daily_streak FROM users WHERE id = $1',
        [userId],
      );

      if (userRes.rows.length === 0) {
        throw new Error('Utilizatorul nu a fost găsit.');
      }

      const lastActiveDate = userRes.rows[0].last_active_date
        ? new Date(userRes.rows[0].last_active_date)
        : null;
      const currentStreak = userRes.rows[0].daily_streak || 0;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // If already active today, no XP awarded but return current streak
      if (lastActiveDate && lastActiveDate.toISOString().split('T')[0] === todayStr) {
        return { daily_streak: currentStreak, streak_bonus: 0, xp_awarded: 0 };
      }

      let newStreak = 1;
      let xpAwarded = XP_VALUES.DAILY_LOGIN;

      if (lastActiveDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastActiveStr = lastActiveDate.toISOString().split('T')[0];

        if (lastActiveStr === yesterdayStr) {
          // Consecutive day — increment streak
          newStreak = currentStreak + 1;
        }
        // Otherwise streak resets to 1 (already set above)
      }

      // Calculate streak bonus multiplier (2x XP after 7 days)
      let streakBonus = 0;
      if (newStreak >= 7) {
        streakBonus = Math.floor(newStreak / 7) * XP_VALUES.DAILY_LOGIN;
        xpAwarded += streakBonus;
      }

      // Update user's last_active_date and daily_streak
      await query(
        'UPDATE users SET last_active_date = $1::date, daily_streak = $2 WHERE id = $3',
        [todayStr, newStreak, userId],
      );

      // Award XP
      await this.addXp(userId, xpAwarded);

      // Check streak milestone badges
      await this.evaluateStreakBadges(userId, newStreak);

      console.log(
        `[Gamification] User ${userId} streak: ${newStreak} days, awarded ${xpAwarded} XP`,
      );

      return { daily_streak: newStreak, streak_bonus: streakBonus, xp_awarded: xpAwarded };
    } catch (error) {
      console.error('[Eroare GamificationService] Nu s-a putut actualiza streak-ul:', error);
      throw error;
    }
  },

  /**
   * Evaluate streak milestone badges for a user.
   */
  async evaluateStreakBadges(userId: number, currentStreak: number): Promise<void> {
    try {
      const availableBadgesRes = await query(
        `
        SELECT b.id, b.name, b.requirement_value 
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
        WHERE b.requirement_type = 'STREAK_MILESTONE' AND ub.badge_id IS NULL
      `,
        [userId],
      );

      for (const badge of availableBadgesRes.rows) {
        if (currentStreak >= badge.requirement_value) {
          await query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [
            userId,
            badge.id,
          ]);
          console.log(
            `[Gamification] Utilizatorul ${userId} a deblocat insigna: "${badge.name}"! 🏅`,
          );
        }
      }
    } catch (error) {
      console.error('[Eroare GamificationService] Evaluare insigne streak eșuată:', error);
    }
  },

  async evaluateBadges(userId: number): Promise<void> {
    try {
      const availableBadgesRes = await query(
        `
        SELECT b.id, b.name, b.requirement_type, b.requirement_value 
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
        WHERE ub.badge_id IS NULL
      `,
        [userId],
      );

      const availableBadges = availableBadgesRes.rows;
      if (availableBadges.length === 0) return;

      for (const badge of availableBadges) {
        let criteriaMet = false;

        switch (badge.requirement_type) {
          case 'QUOTES_COUNT': {
            const quotesRes = await query('SELECT COUNT(*) FROM quotes WHERE user_id = $1', [
              userId,
            ]);
            if (parseInt(quotesRes.rows[0].count, 10) >= badge.requirement_value)
              criteriaMet = true;
            break;
          }

          case 'COMMENTS_COUNT': {
            const commentsRes = await query('SELECT COUNT(*) FROM comments WHERE user_id = $1', [
              userId,
            ]);
            if (parseInt(commentsRes.rows[0].count, 10) >= badge.requirement_value)
              criteriaMet = true;
            break;
          }

          case 'FRIENDS_COUNT': {
            const friendsRes = await query(
              `
              SELECT COUNT(*) FROM friendships 
              WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'accepted'
            `,
              [userId],
            );
            if (parseInt(friendsRes.rows[0].count, 10) >= badge.requirement_value)
              criteriaMet = true;
            break;
          }

          case 'QUOTE_LIKES': {
            const likesRes = await query(
              `
              SELECT COUNT(*) FROM quote_reactions qr
              JOIN quotes q ON qr.quote_id = q.id
              WHERE q.user_id = $1 AND qr.reaction_type = 'BLUE_HEART'
            `,
              [userId],
            );
            if (parseInt(likesRes.rows[0].count, 10) >= badge.requirement_value)
              criteriaMet = true;
            break;
          }

          case 'REACTIONS_GIVEN': {
            const reactionsGivenRes = await query(
              `SELECT COUNT(*) FROM quote_reactions WHERE user_id = $1`,
              [userId],
            );
            if (parseInt(reactionsGivenRes.rows[0].count, 10) >= badge.requirement_value)
              criteriaMet = true;
            break;
          }
        }

        if (criteriaMet) {
          await query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [
            userId,
            badge.id,
          ]);
          console.log(
            `[Gamification] Utilizatorul ${userId} a deblocat insigna: "${badge.name}"! 🏅`,
          );
        }
      }
    } catch (error) {
      console.error('[Eroare GamificationService] Evaluare insigne eșuată:', error);
    }
  },
};

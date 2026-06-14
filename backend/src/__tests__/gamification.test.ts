// ---------------------------------------------------------------------------
// Mocks — must be declared before any module imports that use them
// ---------------------------------------------------------------------------

const mockQuery = jest.fn();

jest.mock('../config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { GamificationService, XP_VALUES } from '../services/gamificationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = 1;

/**
 * Helper to build a mock user row with optional overrides.
 */
function buildUserRow(overrides: Partial<{ xp: number; level: number }> = {}) {
  return {
    rows: [
      {
        xp: overrides.xp ?? 50,
        level: overrides.level ?? 1,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GamificationService.addXp() — Unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Happy path — XP added without level-up
  // -----------------------------------------------------------------------

  describe('Happy path — adding XP without leveling up', () => {
    it('adds XP and returns the correct newXp, newLevel, and leveledUp=false', async () => {
      // Arrange: user has 50 XP at level 1, add 10 XP → 60 XP → still level 1
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 50, level: 1 }))
        .mockResolvedValueOnce(undefined); // UPDATE query returns nothing

      // Act
      const result = await GamificationService.addXp(USER_ID, XP_VALUES.ADD_QUOTE);

      // Assert
      expect(result).toEqual({
        newXp: 60,
        newLevel: 1,
        leveledUp: false,
      });

      // Verify SELECT query
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'SELECT xp, level FROM users WHERE id = $1',
        [USER_ID],
      );

      // Verify UPDATE query with correct values
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'UPDATE users SET xp = $1, level = $2 WHERE id = $3',
        [60, 1, USER_ID],
      );
    });

    it('handles zero XP gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 0, level: 1 }))
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 0);

      expect(result).toEqual({
        newXp: 0,
        newLevel: 1,
        leveledUp: false,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Level-up scenario
  // -----------------------------------------------------------------------

  describe('Level-up scenario — enough XP to trigger a level change', () => {
    it('returns leveledUp=true when XP crosses the next level threshold', async () => {
      // Arrange: 99 XP at level 1, add 1 XP → 100 XP → floor(sqrt(100/100)) + 1 = 2
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 99, level: 1 }))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await GamificationService.addXp(USER_ID, 1);

      // Assert
      expect(result).toEqual({
        newXp: 100,
        newLevel: 2,
        leveledUp: true,
      });

      // Verify the UPDATE used the calculated level
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'UPDATE users SET xp = $1, level = $2 WHERE id = $3',
        [100, 2, USER_ID],
      );
    });

    it('levels up multiple times when adding a large amount of XP', async () => {
      // Arrange: 0 XP at level 1, add 500 XP → 500 XP → floor(sqrt(500/100)) + 1 = 3
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 0, level: 1 }))
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 500);

      expect(result).toEqual({
        newXp: 500,
        newLevel: 3,
        leveledUp: true,
      });
    });

    it('levels up from a higher starting level correctly', async () => {
      // Arrange: 300 XP at level 2, add 100 XP → 400 XP → floor(sqrt(400/100)) + 1 = 3
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 300, level: 2 }))
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 100);

      expect(result).toEqual({
        newXp: 400,
        newLevel: 3,
        leveledUp: true,
      });
    });

    it('does not level up when XP is exactly at the boundary of the current level', async () => {
      // Arrange: 99 XP at level 1, add 0 XP → 99 XP → floor(sqrt(99/100)) + 1 = 1
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 99, level: 1 }))
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 0);

      expect(result).toEqual({
        newXp: 99,
        newLevel: 1,
        leveledUp: false,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Error paths
  // -----------------------------------------------------------------------

  describe('Error path — database failures', () => {
    it('throws when the user is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(GamificationService.addXp(USER_ID, 10)).rejects.toThrow(
        'Utilizatorul nu a fost găsit.',
      );

      // The UPDATE should never be called if the user wasn't found
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('throws when the SELECT query fails', async () => {
      const dbError = new Error('Connection timeout');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(GamificationService.addXp(USER_ID, 10)).rejects.toThrow(
        'Connection timeout',
      );
    });

    it('throws when the UPDATE query fails', async () => {
      mockQuery
        .mockResolvedValueOnce(buildUserRow({ xp: 50, level: 1 }))
        .mockRejectedValueOnce(new Error('UPDATE failed'));

      await expect(GamificationService.addXp(USER_ID, 10)).rejects.toThrow(
        'UPDATE failed',
      );
    });

    it('propagates the original error message for unknown errors', async () => {
      const customError = new Error('Custom DB error');
      mockQuery.mockRejectedValueOnce(customError);

      await expect(GamificationService.addXp(USER_ID, 10)).rejects.toThrow(
        'Custom DB error',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases — null / undefined XP in database
  // -----------------------------------------------------------------------

  describe('Edge cases — nullable XP column', () => {
    it('treats null XP as 0', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ xp: null, level: 1 }] })
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 5);

      expect(result).toEqual({
        newXp: 5,
        newLevel: 1,
        leveledUp: false,
      });
    });

    it('treats null level as 1', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ xp: 0, level: null }] })
        .mockResolvedValueOnce(undefined);

      const result = await GamificationService.addXp(USER_ID, 5);

      expect(result).toEqual({
        newXp: 5,
        newLevel: 1,
        leveledUp: false,
      });
    });
  });
});

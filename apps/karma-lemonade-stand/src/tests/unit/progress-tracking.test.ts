import { describe, it, expect, beforeEach } from 'vitest';
import { StreakTracker } from '../../server/progress/streak-tracker.js';
import { PersonalBestTracker } from '../../server/progress/personal-best-tracker.js';
import { ProgressService } from '../../server/progress/progress-service.js';
import { UserProfile, GameResult, WeatherType, MarketEvent } from '../../shared/types/game.js';

describe('StreakTracker', () => {
  let mockProfile: UserProfile;

  beforeEach(() => {
    mockProfile = {
      userId: 'test-user',
      username: 'testuser',
      redditStats: {
        postKarma: 1000,
        commentKarma: 500,
        accountAgeDays: 365,
        awards: 5,
        lastUpdated: new Date()
      },
      gameStats: {
        service: 10,
        marketing: 8,
        reputation: 12
      },
      progress: {
        totalRuns: 5,
        currentStreak: 2,
        longestStreak: 3,
        bestProfit: 25.50,
        lastPlayDate: '2024-01-14', // Yesterday
        totalProfit: 100.25
      },
      powerups: {
        usedToday: {},
        lastResetDate: '2024-01-15'
      }
    };
  });

  describe('updateStreak', () => {
    it('should increment streak for consecutive days', () => {
      const result = StreakTracker.updateStreak(mockProfile);

      expect(result.currentStreak).toBe(3); // 2 + 1
      expect(result.longestStreak).toBe(3); // Updated to match current
      expect(result.lastPlayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should reset streak for missed days', () => {
      mockProfile.progress.lastPlayDate = '2024-01-10'; // 5 days ago
      
      const result = StreakTracker.updateStreak(mockProfile);

      expect(result.currentStreak).toBe(1); // Reset to 1
      expect(result.longestStreak).toBe(3); // Keeps previous longest
      expect(result.lastPlayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should handle first-time players', () => {
      mockProfile.progress.lastPlayDate = undefined;
      mockProfile.progress.currentStreak = 0;
      
      const result = StreakTracker.updateStreak(mockProfile);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastPlayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should not change streak for same day', () => {
      mockProfile.progress.lastPlayDate = new Date().toISOString().split('T')[0]; // Today
      
      const result = StreakTracker.updateStreak(mockProfile);

      expect(result.currentStreak).toBe(2); // No change
      expect(result.lastPlayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should update longest streak when current exceeds it', () => {
      mockProfile.progress.currentStreak = 5;
      mockProfile.progress.longestStreak = 3;
      
      const result = StreakTracker.updateStreak(mockProfile);

      expect(result.currentStreak).toBe(6); // 5 + 1
      expect(result.longestStreak).toBe(6); // Updated to new record
    });
  });

  describe('hasPlayedToday', () => {
    it('should return true if played today', () => {
      mockProfile.progress.lastPlayDate = new Date().toISOString().split('T')[0];
      
      const result = StreakTracker.hasPlayedToday(mockProfile);
      
      expect(result).toBe(true);
    });

    it('should return false if not played today', () => {
      mockProfile.progress.lastPlayDate = '2024-01-14';
      
      const result = StreakTracker.hasPlayedToday(mockProfile);
      
      expect(result).toBe(false);
    });

    it('should return false if never played', () => {
      mockProfile.progress.lastPlayDate = undefined;
      
      const result = StreakTracker.hasPlayedToday(mockProfile);
      
      expect(result).toBe(false);
    });
  });

  describe('getStreakStatus', () => {
    it('should return correct streak status', () => {
      const status = StreakTracker.getStreakStatus(mockProfile);

      expect(status.current).toBe(2);
      expect(status.longest).toBe(3);
      expect(status.playedToday).toBe(false);
    });
  });
});

describe('PersonalBestTracker', () => {
  let mockProfile: UserProfile;
  let mockGameResult: GameResult;

  beforeEach(() => {
    mockProfile = {
      userId: 'test-user',
      username: 'testuser',
      redditStats: {
        postKarma: 1000,
        commentKarma: 500,
        accountAgeDays: 365,
        awards: 5,
        lastUpdated: new Date()
      },
      gameStats: {
        service: 10,
        marketing: 8,
        reputation: 12
      },
      progress: {
        totalRuns: 5,
        currentStreak: 2,
        longestStreak: 3,
        bestProfit: 25.50,
        lastPlayDate: '2024-01-14',
        totalProfit: 100.25
      },
      powerups: {
        usedToday: {},
        lastResetDate: '2024-01-15'
      }
    };

    mockGameResult = {
      profit: 30.75,
      cupsSold: 45,
      weather: WeatherType.SUNNY,
      event: MarketEvent.NONE,
      festival: 'summer-festival',
      streak: 3,
      seed: 'test-seed-123',
      powerupsApplied: []
    };
  });

  describe('updatePersonalBest', () => {
    it('should update best profit when new record is set', () => {
      const result = PersonalBestTracker.updatePersonalBest(mockProfile, mockGameResult);

      expect(result.bestProfit).toBe(30.75); // New record
      expect(result.totalRuns).toBe(6); // 5 + 1
      expect(result.lastPlayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should not update best profit when not a record', () => {
      mockGameResult.profit = 20.00; // Lower than current best of 25.50
      
      const result = PersonalBestTracker.updatePersonalBest(mockProfile, mockGameResult);

      expect(result.bestProfit).toBe(25.50); // Unchanged
      expect(result.totalRuns).toBe(6); // Still incremented
    });

    it('should handle first game', () => {
      mockProfile.progress.totalRuns = 0;
      mockProfile.progress.bestProfit = 0;
      
      const result = PersonalBestTracker.updatePersonalBest(mockProfile, mockGameResult);

      expect(result.bestProfit).toBe(30.75);
      expect(result.totalRuns).toBe(1);
    });
  });

  describe('getPersonalStats', () => {
    it('should return correct personal statistics', () => {
      const stats = PersonalBestTracker.getPersonalStats(mockProfile);

      expect(stats.bestProfit).toBe(25.50);
      expect(stats.totalRuns).toBe(5);
      expect(stats.lastPlayDate).toBe('2024-01-14');
      expect(stats.averageProfit).toBe(20.05); // 100.25 / 5
    });

    it('should handle zero runs', () => {
      mockProfile.progress.totalRuns = 0;
      mockProfile.progress.totalProfit = 0;
      
      const stats = PersonalBestTracker.getPersonalStats(mockProfile);

      expect(stats.averageProfit).toBe(0);
      expect(stats.totalRuns).toBe(0);
    });
  });

  describe('isNewPersonalBest', () => {
    it('should return true for new record', () => {
      const isNewBest = PersonalBestTracker.isNewPersonalBest(mockProfile, 30.00);
      
      expect(isNewBest).toBe(true);
    });

    it('should return false for non-record', () => {
      const isNewBest = PersonalBestTracker.isNewPersonalBest(mockProfile, 20.00);
      
      expect(isNewBest).toBe(false);
    });

    it('should return true for first game', () => {
      mockProfile.progress.bestProfit = 0;
      
      const isNewBest = PersonalBestTracker.isNewPersonalBest(mockProfile, 10.00);
      
      expect(isNewBest).toBe(true);
    });
  });
});

describe('ProgressService', () => {
  let mockProfile: UserProfile;
  let mockGameResult: GameResult;

  beforeEach(() => {
    mockProfile = {
      userId: 'test-user',
      username: 'testuser',
      redditStats: {
        postKarma: 1000,
        commentKarma: 500,
        accountAgeDays: 365,
        awards: 5,
        lastUpdated: new Date()
      },
      gameStats: {
        service: 10,
        marketing: 8,
        reputation: 12
      },
      progress: {
        totalRuns: 4, // Will become 5 after update
        currentStreak: 4, // Will become 5 after update
        longestStreak: 3,
        bestProfit: 20.00,
        lastPlayDate: '2024-01-14',
        totalProfit: 80.00
      },
      powerups: {
        usedToday: {},
        lastResetDate: '2024-01-15'
      }
    };

    mockGameResult = {
      profit: 25.50,
      cupsSold: 45,
      weather: WeatherType.SUNNY,
      event: MarketEvent.NONE,
      festival: 'summer-festival',
      streak: 5,
      seed: 'test-seed-123',
      powerupsApplied: []
    };
  });

  describe('updateProgress', () => {
    it('should update all progress metrics correctly', () => {
      const result = ProgressService.updateProgress(mockProfile, mockGameResult);

      expect(result.streak.currentStreak).toBe(5);
      expect(result.streak.longestStreak).toBe(5); // New record
      expect(result.personalBest.bestProfit).toBe(25.50); // New record
      expect(result.personalBest.totalRuns).toBe(5);
      expect(result.isNewBest).toBe(true);
    });

    it('should detect streak milestones', () => {
      mockProfile.progress.currentStreak = 4; // Will become 5
      
      const result = ProgressService.updateProgress(mockProfile, mockGameResult);

      expect(result.streakMilestone).toBe(5);
    });

    it('should not detect milestone if not reached', () => {
      mockProfile.progress.currentStreak = 2; // Will become 3
      
      const result = ProgressService.updateProgress(mockProfile, mockGameResult);

      expect(result.streakMilestone).toBeUndefined();
    });

    it('should detect higher milestones', () => {
      mockProfile.progress.currentStreak = 9; // Will become 10
      
      const result = ProgressService.updateProgress(mockProfile, mockGameResult);

      expect(result.streakMilestone).toBe(10);
    });
  });

  describe('getProgressSummary', () => {
    it('should return complete progress summary', () => {
      const summary = ProgressService.getProgressSummary(mockProfile);

      expect(summary.streak.current).toBe(4);
      expect(summary.streak.longest).toBe(3);
      expect(summary.stats.bestProfit).toBe(20.00);
      expect(summary.stats.totalRuns).toBe(4);
      expect(summary.nextMilestone).toBe(5);
    });

    it('should return null for next milestone when all reached', () => {
      mockProfile.progress.currentStreak = 150; // Beyond all milestones
      
      const summary = ProgressService.getProgressSummary(mockProfile);

      expect(summary.nextMilestone).toBeNull();
    });
  });

  describe('milestone detection', () => {
    it('should detect all defined milestones', () => {
      const milestones = [5, 10, 25, 50, 100];
      
      milestones.forEach(milestone => {
        mockProfile.progress.currentStreak = milestone - 1;
        const result = ProgressService.updateProgress(mockProfile, mockGameResult);
        expect(result.streakMilestone).toBe(milestone);
      });
    });

    it('should not detect milestone if already passed', () => {
      mockProfile.progress.currentStreak = 6; // Already past 5
      
      const result = ProgressService.updateProgress(mockProfile, mockGameResult);

      expect(result.streakMilestone).toBeUndefined();
    });
  });
});

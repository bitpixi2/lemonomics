import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginBonusManager } from '../../server/bonuses/login-bonus-manager';
import { BonusService } from '../../server/services/bonus-service';
import { BonusEffectsHandler } from '../../server/bonuses/bonus-effects-handler';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';
import { LoginBonusType, WeatherType, GameResult } from '../../shared/types/game';

// Mock the UserProfileAdapter
const mockUserProfileAdapter = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateProgress: vi.fn()
} as any;

describe('Login Bonus System', () => {
  let loginBonusManager: LoginBonusManager;
  let bonusService: BonusService;
  let bonusEffectsHandler: BonusEffectsHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    loginBonusManager = new LoginBonusManager(mockUserProfileAdapter);
    bonusService = new BonusService(mockUserProfileAdapter);
    bonusEffectsHandler = new BonusEffectsHandler(loginBonusManager);
  });

  describe('LoginBonusManager', () => {
    it('should generate deterministic daily bonuses', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      const date3 = new Date('2024-01-02');

      const bonus1 = loginBonusManager.generateDailyBonus(date1);
      const bonus2 = loginBonusManager.generateDailyBonus(date2);
      const bonus3 = loginBonusManager.generateDailyBonus(date3);

      // Same date should produce same bonus
      expect(bonus1).toBe(bonus2);
      
      // Different dates might produce different bonuses
      expect([LoginBonusType.NONE, LoginBonusType.PERFECT, LoginBonusType.FREE_AD, LoginBonusType.COOLER])
        .toContain(bonus1);
      expect([LoginBonusType.NONE, LoginBonusType.PERFECT, LoginBonusType.FREE_AD, LoginBonusType.COOLER])
        .toContain(bonus3);
    });

    it('should create bonus objects with correct properties', async () => {
      const bonus = await loginBonusManager.previewTodaysBonus();
      
      expect(bonus).toHaveProperty('type');
      expect(bonus).toHaveProperty('description');
      expect(bonus).toHaveProperty('effect');
      expect(bonus).toHaveProperty('duration');
      expect(bonus).toHaveProperty('claimed');
      expect(bonus).toHaveProperty('expiresAt');
      
      expect(bonus.duration).toBe(24);
      expect(bonus.claimed).toBe(false);
      expect(bonus.expiresAt).toBeInstanceOf(Date);
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = (loginBonusManager as any).formatDate(date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should calculate time until next bonus correctly', () => {
      const timeUntilNext = loginBonusManager.getTimeUntilNextBonus();
      expect(timeUntilNext).toBeGreaterThan(0);
      expect(timeUntilNext).toBeLessThanOrEqual(24 * 60 * 60 * 1000); // Max 24 hours
    });
  });

  describe('BonusEffectsHandler', () => {
    it('should apply Perfect Day bonus correctly', async () => {
      const gameResult: GameResult = {
        profit: 100,
        cupsSold: 50,
        weather: WeatherType.SUNNY,
        event: 'NONE' as any,
        festival: 'none',
        streak: 1,
        seed: 'test',
        powerupsApplied: []
      };

      // Mock user has Perfect Day bonus
      mockUserProfileAdapter.getProfile.mockResolvedValue({
        loginBonus: {
          type: LoginBonusType.PERFECT,
          claimed: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now
        }
      });

      vi.spyOn(loginBonusManager, 'getUserBonus').mockResolvedValue({
        type: LoginBonusType.PERFECT,
        description: 'Perfect Day',
        effect: '+15% revenue boost',
        duration: 24,
        claimed: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      });

      const context = {
        userId: 'test-user',
        weather: WeatherType.SUNNY,
        adSpend: 10,
        gameResult
      };

      const result = await bonusEffectsHandler.applyBonusEffects(context);
      
      expect(result.modifiedResult.profit).toBe(115); // 100 * 1.15
      expect(result.bonusesApplied).toContain('Perfect Day: +15% revenue');
    });

    it('should apply Cooler bonus for cold weather', async () => {
      const gameResult: GameResult = {
        profit: 40, // Reduced due to cold weather
        cupsSold: 20, // Reduced due to cold weather
        weather: WeatherType.COLD,
        event: 'NONE' as any,
        festival: 'none',
        streak: 1,
        seed: 'test',
        powerupsApplied: []
      };

      // Mock user has Cooler bonus
      vi.spyOn(loginBonusManager, 'getUserBonus').mockResolvedValue({
        type: LoginBonusType.COOLER,
        description: 'Cooler Weather',
        effect: 'Ignore cold weather penalties',
        duration: 24,
        claimed: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      });

      const context = {
        userId: 'test-user',
        weather: WeatherType.COLD,
        adSpend: 10,
        gameResult
      };

      const result = await bonusEffectsHandler.applyBonusEffects(context);
      
      // Should reverse cold weather penalty (0.4 multiplier -> 1.0 multiplier)
      expect(result.modifiedResult.cupsSold).toBeGreaterThan(gameResult.cupsSold);
      expect(result.bonusesApplied).toContain('Cooler Bonus: Cold weather penalty ignored');
    });

    it('should apply Free Ad bonus', async () => {
      const gameResult: GameResult = {
        profit: 100,
        cupsSold: 50,
        weather: WeatherType.SUNNY,
        event: 'NONE' as any,
        festival: 'none',
        streak: 1,
        seed: 'test',
        powerupsApplied: []
      };

      // Mock user has Free Ad bonus
      vi.spyOn(loginBonusManager, 'getUserBonus').mockResolvedValue({
        type: LoginBonusType.FREE_AD,
        description: 'Free Advertising',
        effect: '+2 free advertising credits',
        duration: 24,
        claimed: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      });

      const context = {
        userId: 'test-user',
        weather: WeatherType.SUNNY,
        adSpend: 10,
        gameResult
      };

      const result = await bonusEffectsHandler.applyBonusEffects(context);
      
      // Should increase cups sold due to free advertising
      expect(result.modifiedResult.cupsSold).toBeGreaterThan(gameResult.cupsSold);
      expect(result.bonusesApplied).toContain('Free Advertising: +2 ad credits applied');
    });

    it('should not apply effects when no bonus is active', async () => {
      const gameResult: GameResult = {
        profit: 100,
        cupsSold: 50,
        weather: WeatherType.SUNNY,
        event: 'NONE' as any,
        festival: 'none',
        streak: 1,
        seed: 'test',
        powerupsApplied: []
      };

      // Mock user has no active bonus
      vi.spyOn(loginBonusManager, 'getUserBonus').mockResolvedValue(null);

      const context = {
        userId: 'test-user',
        weather: WeatherType.SUNNY,
        adSpend: 10,
        gameResult
      };

      const result = await bonusEffectsHandler.applyBonusEffects(context);
      
      expect(result.modifiedResult).toEqual(gameResult);
      expect(result.bonusesApplied).toHaveLength(0);
    });
  });

  describe('BonusService', () => {
    it('should validate bonus claim eligibility', async () => {
      mockUserProfileAdapter.getProfile.mockResolvedValue({
        userId: 'test-user',
        progress: { lastPlayDate: '2024-01-01' }
      });

      vi.spyOn(loginBonusManager, 'canClaimTodaysBonus').mockResolvedValue(true);

      const validation = await bonusService.validateBonusClaim('test-user');
      
      expect(validation.canClaim).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    it('should prevent claiming bonus twice in same day', async () => {
      mockUserProfileAdapter.getProfile.mockResolvedValue({
        userId: 'test-user',
        progress: { lastPlayDate: '2024-01-01' }
      });

      vi.spyOn(loginBonusManager, 'canClaimTodaysBonus').mockResolvedValue(false);

      const validation = await bonusService.validateBonusClaim('test-user');
      
      expect(validation.canClaim).toBe(false);
      expect(validation.reason).toBe('Already claimed today\'s bonus');
    });

    it('should calculate login streak correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      mockUserProfileAdapter.getProfile.mockResolvedValue({
        userId: 'test-user',
        progress: { 
          lastPlayDate: yesterday,
          currentStreak: 5
        }
      });

      const streak = await bonusService.getLoginStreak('test-user');
      
      expect(streak).toBe(5); // Can continue streak from yesterday
    });

    it('should reset streak when user misses a day', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      mockUserProfileAdapter.getProfile.mockResolvedValue({
        userId: 'test-user',
        progress: { 
          lastPlayDate: twoDaysAgo,
          currentStreak: 5
        }
      });

      const streak = await bonusService.getLoginStreak('test-user');
      
      expect(streak).toBe(0); // Streak broken
    });
  });
});

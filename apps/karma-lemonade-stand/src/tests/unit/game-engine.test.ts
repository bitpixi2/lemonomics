import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../server/engine/game-engine.js';
import { DemandCalculator } from '../../server/engine/demand-calculator.js';
import { ProfitCalculator } from '../../server/engine/profit-calculator.js';
import { SeedGenerator } from '../../server/engine/seed-generator.js';
import { GameRun, UserProfile, WeatherType, MarketEvent } from '../../shared/types/game.js';
import { DEFAULT_CONFIG } from '../../shared/types/config.js';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockUserProfile: UserProfile;
  let mockGameRun: GameRun;
  let mockDailyCycle: any;
  let mockWeeklyCycle: any;

  beforeEach(() => {
    gameEngine = new GameEngine(DEFAULT_CONFIG);
    
    mockUserProfile = {
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
        lastPlayDate: '2024-01-15',
        totalProfit: 100.25
      },
      powerups: {
        usedToday: {},
        lastResetDate: '2024-01-15'
      }
    };

    mockGameRun = {
      userId: 'test-user',
      price: 1.00,
      adSpend: 10,
      powerupReceipts: []
    };

    mockDailyCycle = {
      weather: WeatherType.SUNNY,
      event: MarketEvent.NONE,
      lemonPrice: 0.10,
      sugarPrice: 0.05
    };

    mockWeeklyCycle = {
      festival: 'SUMMER_SOLSTICE',
      modifiers: {
        demandMultiplier: 1.3,
        costVolatility: 0.0
      }
    };
  });

  describe('runGame', () => {
    it('should generate a valid game result', async () => {
      const result = await gameEngine.runGame(mockGameRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);

      expect(result).toBeDefined();
      expect(result.profit).toBeTypeOf('number');
      expect(result.cupsSold).toBeTypeOf('number');
      expect(result.cupsSold).toBeGreaterThanOrEqual(0);
      expect(result.weather).toBeTypeOf('string');
      expect(result.event).toBeTypeOf('string');
      expect(result.festival).toBeTypeOf('string');
      expect(result.seed).toBeTypeOf('string');
      expect(Array.isArray(result.powerupsApplied)).toBe(true);
    });

    it('should produce consistent results with same seed', async () => {
      const result1 = await gameEngine.runGame(mockGameRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);
      const result2 = await gameEngine.runGame(mockGameRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);

      // Results should be consistent for same user and run count
      expect(result1.seed).toBe(result2.seed);
      expect(result1.weather).toBe(result2.weather);
      expect(result1.event).toBe(result2.event);
    });

    it('should handle different price points', async () => {
      const lowPriceRun = { ...mockGameRun, price: 0.25 };
      const highPriceRun = { ...mockGameRun, price: 2.50 };

      const lowPriceResult = await gameEngine.runGame(lowPriceRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);
      const highPriceResult = await gameEngine.runGame(highPriceRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);

      expect(lowPriceResult.cupsSold).toBeGreaterThan(highPriceResult.cupsSold);
    });

    it('should handle advertising spend effects', async () => {
      const noAdRun = { ...mockGameRun, adSpend: 0 };
      const highAdRun = { ...mockGameRun, adSpend: 50 };

      const noAdResult = await gameEngine.runGame(noAdRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);
      const highAdResult = await gameEngine.runGame(highAdRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle);

      expect(highAdResult.cupsSold).toBeGreaterThan(noAdResult.cupsSold);
    });
  });

  describe('input validation', () => {
    it('should handle invalid price inputs', async () => {
      const invalidRun = { ...mockGameRun, price: -1 };
      
      await expect(gameEngine.runGame(invalidRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle))
        .rejects.toThrow('Price must be between');
    });

    it('should handle invalid ad spend inputs', async () => {
      const invalidRun = { ...mockGameRun, adSpend: -5 };
      
      await expect(gameEngine.runGame(invalidRun, mockUserProfile, mockDailyCycle, mockWeeklyCycle))
        .rejects.toThrow('Ad spend must be between');
    });

    it('should handle missing user profile', async () => {
      await expect(gameEngine.runGame(mockGameRun, null as any, mockDailyCycle, mockWeeklyCycle))
        .rejects.toThrow();
    });
  });
});

describe('DemandCalculator', () => {
  let demandCalculator: DemandCalculator;

  beforeEach(() => {
    demandCalculator = new DemandCalculator(DEFAULT_CONFIG);
  });

  describe('calculateDemand', () => {
    it('should calculate base demand correctly', () => {
      const demand = demandCalculator.calculateDemand({
        price: 1.00,
        adSpend: 10,
        userStats: {
          service: 10,
          marketing: 10,
          reputation: 10
        },
        weather: WeatherType.SUNNY,
        event: MarketEvent.NONE,
        festival: 'SUMMER_SOLSTICE',
        festivalModifiers: { 
          demandMultiplier: 1.0,
          priceVariance: 0.0,
          criticalSaleChance: 0.0,
          costVolatility: 0.0,
          specialEffects: []
        },
        powerupReceipts: [],
        seed: 'test-seed'
      });

      expect(demand).toBeGreaterThan(0);
      expect(demand).toBeTypeOf('number');
    });

    it('should apply weather effects correctly', () => {
      const sunnyDemand = demandCalculator.calculateDemand({
        price: 1.00,
        adSpend: 10,
        userStats: {
          service: 10,
          marketing: 10,
          reputation: 10
        },
        weather: WeatherType.SUNNY,
        event: MarketEvent.NONE,
        festival: 'SUMMER_SOLSTICE',
        festivalModifiers: { 
          demandMultiplier: 1.0,
          priceVariance: 0.0,
          criticalSaleChance: 0.0,
          costVolatility: 0.0,
          specialEffects: []
        },
        powerupReceipts: [],
        seed: 'test-seed'
      });

      const rainyDemand = demandCalculator.calculateDemand({
        price: 1.00,
        adSpend: 10,
        userStats: {
          service: 10,
          marketing: 10,
          reputation: 10
        },
        weather: WeatherType.RAINY,
        event: MarketEvent.NONE,
        festival: 'SUMMER_SOLSTICE',
        festivalModifiers: { 
          demandMultiplier: 1.0,
          priceVariance: 0.0,
          criticalSaleChance: 0.0,
          costVolatility: 0.0,
          specialEffects: []
        },
        powerupReceipts: [],
        seed: 'test-seed'
      });

      expect(sunnyDemand).toBeGreaterThan(rainyDemand);
    });

    it('should apply price elasticity', () => {
      const lowPriceDemand = demandCalculator.calculateDemand({
        price: 0.50,
        adSpend: 10,
        userStats: {
          service: 10,
          marketing: 10,
          reputation: 10
        },
        weather: WeatherType.SUNNY,
        event: MarketEvent.NONE,
        festival: 'SUMMER_SOLSTICE',
        festivalModifiers: { 
          demandMultiplier: 1.0,
          priceVariance: 0.0,
          criticalSaleChance: 0.0,
          costVolatility: 0.0,
          specialEffects: []
        },
        powerupReceipts: [],
        seed: 'test-seed'
      });

      const highPriceDemand = demandCalculator.calculateDemand({
        price: 2.00,
        adSpend: 10,
        userStats: {
          service: 10,
          marketing: 10,
          reputation: 10
        },
        weather: WeatherType.SUNNY,
        event: MarketEvent.NONE,
        festival: 'SUMMER_SOLSTICE',
        festivalModifiers: { 
          demandMultiplier: 1.0,
          priceVariance: 0.0,
          criticalSaleChance: 0.0,
          costVolatility: 0.0,
          specialEffects: []
        },
        powerupReceipts: [],
        seed: 'test-seed'
      });

      expect(lowPriceDemand).toBeGreaterThan(highPriceDemand);
    });
  });
});

describe('ProfitCalculator', () => {
  let profitCalculator: ProfitCalculator;

  beforeEach(() => {
    profitCalculator = new ProfitCalculator(DEFAULT_CONFIG);
  });

  describe('calculateProfit', () => {
    it('should calculate profit correctly', () => {
      const profit = profitCalculator.calculateProfit({
        cupsSold: 50,
        price: 1.00,
        adSpend: 10,
        lemonPrice: 0.10,
        sugarPrice: 0.05,
        event: MarketEvent.NONE,
        festivalModifiers: { costVolatility: 0.0 }
      });

      expect(profit).toBeTypeOf('number');
      // Revenue (50 * 1.00) - Costs (materials + fixed + ads) should be positive
      expect(profit).toBeGreaterThan(0);
    });

    it('should handle zero sales', () => {
      const profit = profitCalculator.calculateProfit({
        cupsSold: 0,
        price: 1.00,
        adSpend: 10,
        lemonPrice: 0.10,
        sugarPrice: 0.05,
        event: MarketEvent.NONE,
        festivalModifiers: { costVolatility: 0.0 }
      });

      // Should be negative due to fixed costs and ad spend
      expect(profit).toBeLessThan(0);
    });

    it('should apply market event effects', () => {
      const normalProfit = profitCalculator.calculateProfit({
        cupsSold: 50,
        price: 1.00,
        adSpend: 10,
        lemonPrice: 0.10,
        sugarPrice: 0.05,
        event: MarketEvent.NONE,
        festivalModifiers: { costVolatility: 0.0 }
      });

      const inflationProfit = profitCalculator.calculateProfit({
        cupsSold: 50,
        price: 1.00,
        adSpend: 10,
        lemonPrice: 0.10,
        sugarPrice: 0.05,
        event: MarketEvent.INFLATION,
        festivalModifiers: { costVolatility: 0.0 }
      });

      expect(normalProfit).toBeGreaterThan(inflationProfit);
    });
  });
});

describe('SeedGenerator', () => {
  let seedGenerator: SeedGenerator;

  beforeEach(() => {
    seedGenerator = new SeedGenerator();
  });

  describe('generateSeed', () => {
    it('should generate consistent seeds for same inputs', () => {
      const seed1 = seedGenerator.generateSeed('user123', 5);
      const seed2 = seedGenerator.generateSeed('user123', 5);

      expect(seed1).toBe(seed2);
    });

    it('should generate different seeds for different users', () => {
      const seed1 = seedGenerator.generateSeed('user123', 5);
      const seed2 = seedGenerator.generateSeed('user456', 5);

      expect(seed1).not.toBe(seed2);
    });

    it('should generate different seeds for different run counts', () => {
      const seed1 = seedGenerator.generateSeed('user123', 5);
      const seed2 = seedGenerator.generateSeed('user123', 6);

      expect(seed1).not.toBe(seed2);
    });

    it('should generate valid seed format', () => {
      const seed = seedGenerator.generateSeed('user123', 5);

      expect(seed).toBeTypeOf('string');
      expect(seed.length).toBeGreaterThan(0);
      expect(seed).toMatch(/^[a-f0-9]+$/); // Hexadecimal format
    });
  });
});

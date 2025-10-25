import { GameRun, GameResult, UserProfile, DailyCycle, WeeklyCycle } from '../../shared/types/game';
import { GameConfig } from '../../shared/types/config';
import { DemandCalculator } from './demand-calculator';
import { ProfitCalculator } from './profit-calculator';
import { SeedGenerator } from './seed-generator';
import { BonusEffectsHandler, BonusEffectContext } from '../bonuses/bonus-effects-handler';
import { PowerupManager } from '../payments-disabled/payments/powerup-manager';

export class GameEngine {
  private config: GameConfig;
  private demandCalculator: DemandCalculator;
  private profitCalculator: ProfitCalculator;
  private seedGenerator: SeedGenerator;
  private bonusEffectsHandler?: BonusEffectsHandler | undefined;
  private powerupManager?: PowerupManager | undefined;

  constructor(
    config: GameConfig, 
    bonusEffectsHandler?: BonusEffectsHandler,
    powerupManager?: PowerupManager
  ) {
    this.config = config;
    this.demandCalculator = new DemandCalculator(config);
    this.profitCalculator = new ProfitCalculator(config);
    this.seedGenerator = new SeedGenerator();
    this.bonusEffectsHandler = bonusEffectsHandler;
    this.powerupManager = powerupManager;
  }

  /**
   * Orchestrates a complete game run with all systems
   */
  async runGame(
    gameRun: GameRun,
    userProfile: UserProfile,
    dailyCycle: DailyCycle,
    weeklyCycle: WeeklyCycle
  ): Promise<GameResult> {
    // Validate inputs
    this.validateGameRun(gameRun);

    // Generate deterministic seed for this run
    const seed = this.seedGenerator.generateSeed(
      gameRun.userId,
      (userProfile.progress.totalRuns || 0) + 1
    );

    // Calculate demand based on all factors
    const cupsSold = this.demandCalculator.calculateDemand({
      price: gameRun.price,
      adSpend: gameRun.adSpend,
      userStats: userProfile.gameStats,
      weather: dailyCycle.weather,
      event: dailyCycle.event,
      festival: weeklyCycle.festival,
      festivalModifiers: weeklyCycle.modifiers,
      powerupReceipts: gameRun.powerupReceipts || [],
      seed
    });

    // Calculate profit from the run
    const profit = this.profitCalculator.calculateProfit({
      cupsSold,
      price: gameRun.price,
      adSpend: gameRun.adSpend,
      lemonPrice: dailyCycle.lemonPrice,
      sugarPrice: dailyCycle.sugarPrice,
      event: dailyCycle.event,
      festivalModifiers: weeklyCycle.modifiers
    });

    // Determine applied powerups
    const powerupsApplied = this.extractPowerupTypes(gameRun.powerupReceipts || []);

    // Create initial game result
    let gameResult: GameResult = {
      profit,
      cupsSold,
      weather: dailyCycle.weather,
      event: dailyCycle.event,
      festival: weeklyCycle.festival,
      streak: userProfile.progress.currentStreak || 0,
      seed,
      powerupsApplied
    };

    // Apply power-up effects if manager is available and receipts provided
    if (this.powerupManager && gameRun.powerupReceipts && gameRun.powerupReceipts.length > 0) {
      const powerupResult = await this.powerupManager.applyPowerupEffects(
        gameRun.userId,
        gameRun.powerupReceipts,
        gameResult
      );
      
      gameResult = powerupResult.modifiedResult;
      
      // Add power-up information to result
      if (powerupResult.effectsDescription.length > 0) {
        (gameResult as any).powerupEffects = powerupResult.effectsDescription;
      }
    }

    // Apply bonus effects if handler is available
    if (this.bonusEffectsHandler) {
      const bonusContext: BonusEffectContext = {
        userId: gameRun.userId,
        weather: dailyCycle.weather,
        adSpend: gameRun.adSpend,
        gameResult
      };

      const { modifiedResult, bonusesApplied } = await this.bonusEffectsHandler.applyBonusEffects(bonusContext);
      gameResult = modifiedResult;
      
      // Add bonus information to result if any bonuses were applied
      if (bonusesApplied.length > 0) {
        (gameResult as any).bonusesApplied = bonusesApplied;
      }
    }

    return gameResult;
  }

  /**
   * Validates game run inputs against configuration limits
   */
  private validateGameRun(gameRun: GameRun): void {
    const { game } = this.config;

    if (gameRun.price < game.minPrice || gameRun.price > game.maxPrice) {
      throw new Error(
        `Price must be between $${game.minPrice} and $${game.maxPrice}`
      );
    }

    if (gameRun.adSpend < game.minAdSpend || gameRun.adSpend > game.maxAdSpend) {
      throw new Error(
        `Ad spend must be between $${game.minAdSpend} and $${game.maxAdSpend}`
      );
    }

    // Validate powerup receipts if present
    if (gameRun.powerupReceipts) {
      for (const receipt of gameRun.powerupReceipts) {
        if (!this.config.payments.powerups[receipt.sku]) {
          throw new Error(`Invalid powerup SKU: ${receipt.sku}`);
        }
      }
    }
  }

  /**
   * Extracts powerup types from payment receipts
   */
  private extractPowerupTypes(receipts: any[]): string[] {
    return receipts.map(receipt => {
      const powerupConfig = this.config.payments.powerups[receipt.sku];
      return powerupConfig?.effects.type || 'UNKNOWN';
    });
  }
}

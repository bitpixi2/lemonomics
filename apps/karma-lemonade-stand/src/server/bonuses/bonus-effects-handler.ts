import { LoginBonusType, WeatherType, GameResult } from '../../shared/types/game';
import { LoginBonusManager } from './login-bonus-manager';

export interface BonusEffectContext {
  userId: string;
  weather: WeatherType;
  adSpend: number;
  gameResult: GameResult;
}

export class BonusEffectsHandler {
  private loginBonusManager: LoginBonusManager;

  constructor(loginBonusManager: LoginBonusManager) {
    this.loginBonusManager = loginBonusManager;
  }

  /**
   * Applies all active bonus effects to game calculations
   */
  async applyBonusEffects(context: BonusEffectContext): Promise<{
    modifiedResult: GameResult;
    bonusesApplied: string[];
  }> {
    const bonusesApplied: string[] = [];
    let modifiedResult = { ...context.gameResult };

    // Get user's active bonus
    const activeBonus = await this.loginBonusManager.getUserBonus(context.userId);
    
    if (!activeBonus || !activeBonus.claimed) {
      return { modifiedResult, bonusesApplied };
    }

    switch (activeBonus.type) {
      case LoginBonusType.PERFECT:
        modifiedResult = this.applyPerfectDayBonus(modifiedResult);
        bonusesApplied.push('Perfect Day: +15% revenue');
        break;

      case LoginBonusType.FREE_AD:
        modifiedResult = this.applyFreeAdBonus(modifiedResult, context.adSpend);
        bonusesApplied.push('Free Advertising: +2 ad credits applied');
        break;

      case LoginBonusType.COOLER:
        modifiedResult = this.applyCoolerBonus(modifiedResult, context.weather);
        if (context.weather === WeatherType.COLD) {
          bonusesApplied.push('Cooler Bonus: Cold weather penalty ignored');
        }
        break;

      default:
        break;
    }

    return { modifiedResult, bonusesApplied };
  }

  /**
   * Applies Perfect Day bonus - 15% revenue increase
   */
  private applyPerfectDayBonus(gameResult: GameResult): GameResult {
    const revenueBoost = 1.15;
    const boostedProfit = gameResult.profit * revenueBoost;
    
    return {
      ...gameResult,
      profit: Math.round(boostedProfit * 100) / 100
    };
  }

  /**
   * Applies Free Ad bonus - simulates +2 advertising credits
   */
  private applyFreeAdBonus(gameResult: GameResult, _originalAdSpend: number): GameResult {
    // Simulate the effect of having 2 extra advertising credits
    // This would normally be handled in the demand calculator
    // For now, we'll apply a modest boost to cups sold
    const adBoostEffect = 1.1; // 10% boost from free advertising
    const boostedCupsSold = Math.round(gameResult.cupsSold * adBoostEffect);
    
    // Recalculate profit with boosted sales
    // Note: This is a simplified calculation - in practice, this would be integrated
    // with the demand calculator to properly simulate the advertising effect
    const additionalRevenue = (boostedCupsSold - gameResult.cupsSold) * (gameResult.profit / gameResult.cupsSold || 0);
    
    return {
      ...gameResult,
      cupsSold: boostedCupsSold,
      profit: Math.round((gameResult.profit + additionalRevenue) * 100) / 100
    };
  }

  /**
   * Applies Cooler bonus - negates cold weather penalties
   */
  private applyCoolerBonus(gameResult: GameResult, weather: WeatherType): GameResult {
    if (weather !== WeatherType.COLD) {
      return gameResult; // No effect if not cold weather
    }

    // Cold weather typically reduces demand by 60% (0.4 multiplier)
    // The cooler bonus negates this penalty, so we need to reverse it
    const coldWeatherPenalty = 0.4;
    const normalWeatherMultiplier = 1.0;
    
    // Calculate what the result would have been without cold weather
    const adjustmentFactor = normalWeatherMultiplier / coldWeatherPenalty;
    const adjustedCupsSold = Math.round(gameResult.cupsSold * adjustmentFactor);
    
    // Recalculate profit based on adjusted sales
    const pricePerCup = gameResult.cupsSold > 0 ? gameResult.profit / gameResult.cupsSold : 0;
    const adjustedProfit = adjustedCupsSold * pricePerCup;
    
    return {
      ...gameResult,
      cupsSold: adjustedCupsSold,
      profit: Math.round(adjustedProfit * 100) / 100
    };
  }

  /**
   * Checks if a specific bonus type is active for a user
   */
  async isBonusActive(userId: string, bonusType: LoginBonusType): Promise<boolean> {
    return await this.loginBonusManager.hasActiveBonus(userId, bonusType);
  }

  /**
   * Gets all active bonus effects for a user
   */
  async getActiveBonusEffects(userId: string): Promise<{
    bonusType: LoginBonusType;
    description: string;
    effect: string;
    timeRemaining: number;
  } | null> {
    const activeBonus = await this.loginBonusManager.getUserBonus(userId);
    
    if (!activeBonus || !activeBonus.claimed) {
      return null;
    }

    const timeRemaining = activeBonus.expiresAt.getTime() - Date.now();
    
    return {
      bonusType: activeBonus.type,
      description: activeBonus.description,
      effect: activeBonus.effect,
      timeRemaining: Math.max(0, timeRemaining)
    };
  }



  /**
   * Calculates the potential value of a bonus for preview purposes
   */
  async calculateBonusValue(_userId: string, bonusType: LoginBonusType, gameResult: GameResult): Promise<{
    estimatedBenefit: number;
    description: string;
  }> {
    switch (bonusType) {
      case LoginBonusType.PERFECT:
        return {
          estimatedBenefit: gameResult.profit * 0.15,
          description: 'Increases revenue by 15%'
        };
      
      case LoginBonusType.FREE_AD:
        return {
          estimatedBenefit: gameResult.cupsSold * 0.1, // Rough estimate
          description: 'Equivalent to 2 free advertising credits'
        };
      
      case LoginBonusType.COOLER:
        return {
          estimatedBenefit: gameResult.cupsSold * 1.5, // Rough cold weather compensation
          description: 'Prevents cold weather sales penalties'
        };
      
      default:
        return {
          estimatedBenefit: 0,
          description: 'No bonus effects'
        };
    }
  }
}

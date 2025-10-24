import { PaymentReceipt, GameResult } from '../../shared/types/game';
import { GameConfig, PowerupConfig } from '../../shared/types/config';
import { PaymentService } from './payment-service';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';

export interface PowerupEffect {
  type: string;
  demandBonus: number;
  serviceBonus: number;
  duration: string;
}

export interface ActivePowerup {
  sku: string;
  type: string;
  effects: PowerupEffect;
  receiptId: string;
  appliedAt: number;
}

export class PowerupManager {
  private config: GameConfig;
  private paymentService: PaymentService;
  private userProfileAdapter: UserProfileAdapter;

  constructor(
    config: GameConfig,
    paymentService: PaymentService,
    userProfileAdapter: UserProfileAdapter
  ) {
    this.config = config;
    this.paymentService = paymentService;
    this.userProfileAdapter = userProfileAdapter;
  }

  /**
   * Applies power-up effects to game calculations
   */
  async applyPowerupEffects(
    userId: string,
    receipts: PaymentReceipt[],
    gameResult: GameResult
  ): Promise<{
    modifiedResult: GameResult;
    powerupsApplied: string[];
    effectsDescription: string[];
  }> {
    const powerupsApplied: string[] = [];
    const effectsDescription: string[] = [];
    let modifiedResult = { ...gameResult };

    // Verify and apply each power-up
    for (const receipt of receipts) {
      const verification = await this.paymentService.verifyReceipt(receipt.receiptId);
      
      if (!verification.valid || !verification.receipt) {
        console.warn(`Invalid receipt: ${receipt.receiptId}`);
        continue;
      }

      const powerupConfig = this.config.payments.powerups[receipt.sku];
      if (!powerupConfig) {
        console.warn(`Unknown power-up SKU: ${receipt.sku}`);
        continue;
      }

      // Check daily usage limits
      const canUse = await this.canUsePowerup(userId, receipt.sku);
      if (!canUse.allowed) {
        console.warn(`Power-up usage denied: ${canUse.reason}`);
        continue;
      }

      // Apply power-up effects
      const effectResult = this.applyPowerupEffect(powerupConfig, modifiedResult);
      modifiedResult = effectResult.result;
      
      powerupsApplied.push(powerupConfig.effects.type);
      effectsDescription.push(effectResult.description);

      // Track power-up usage
      await this.trackPowerupUsage(userId, receipt);
    }

    return {
      modifiedResult,
      powerupsApplied,
      effectsDescription
    };
  }

  /**
   * Applies a single power-up effect
   */
  private applyPowerupEffect(
    powerupConfig: PowerupConfig,
    gameResult: GameResult
  ): {
    result: GameResult;
    description: string;
  } {
    let modifiedResult = { ...gameResult };
    let description = '';

    switch (powerupConfig.effects.type) {
      case 'SUPER_SUGAR':
        // Apply demand bonus
        const demandBoost = 1 + powerupConfig.effects.demandBonus;
        const boostedCupsSold = Math.round(gameResult.cupsSold * demandBoost);
        
        // Apply service bonus (affects quality/reputation)
        const serviceBonus = powerupConfig.effects.serviceBonus;
        
        // Recalculate profit with boosted sales
        const pricePerCup = gameResult.cupsSold > 0 ? gameResult.profit / gameResult.cupsSold : 0;
        const additionalRevenue = (boostedCupsSold - gameResult.cupsSold) * pricePerCup;
        
        modifiedResult = {
          ...gameResult,
          cupsSold: boostedCupsSold,
          profit: Math.round((gameResult.profit + additionalRevenue) * 100) / 100
        };
        
        description = `Super Sugar: +${Math.round(powerupConfig.effects.demandBonus * 100)}% demand, +${serviceBonus} service`;
        break;

      default:
        console.warn(`Unknown power-up type: ${powerupConfig.effects.type}`);
        return { result: gameResult, description: 'Unknown power-up effect' };
    }

    return { result: modifiedResult, description };
  }

  /**
   * Checks if a user can use a specific power-up
   */
  async canUsePowerup(userId: string, sku: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const powerupConfig = this.config.payments.powerups[sku];
    if (!powerupConfig) {
      return {
        allowed: false,
        reason: 'Invalid power-up'
      };
    }

    // Check daily usage limits
    const usage = await this.userProfileAdapter.getPowerupUsage(userId);
    const usedToday = usage[sku] || 0;
    
    if (usedToday >= powerupConfig.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of ${powerupConfig.dailyLimit} uses exceeded`
      };
    }

    return { allowed: true };
  }

  /**
   * Gets user's power-up usage statistics
   */
  async getPowerupStats(userId: string): Promise<{
    dailyUsage: Record<string, number>;
    limits: Record<string, number>;
    remaining: Record<string, number>;
    totalUsed: number;
  }> {
    const dailyUsage = await this.userProfileAdapter.getPowerupUsage(userId);
    const limits: Record<string, number> = {};
    const remaining: Record<string, number> = {};
    let totalUsed = 0;

    for (const [sku, config] of Object.entries(this.config.payments.powerups)) {
      const used = dailyUsage[sku] || 0;
      limits[sku] = config.dailyLimit;
      remaining[sku] = Math.max(0, config.dailyLimit - used);
      totalUsed += used;
    }

    return {
      dailyUsage,
      limits,
      remaining,
      totalUsed
    };
  }

  /**
   * Determines if a user should be targeted for power-up offers
   */
  async shouldTargetForPowerups(userId: string): Promise<{
    shouldTarget: boolean;
    reasons: string[];
    suggestedPowerups: string[];
  }> {
    const profile = await this.userProfileAdapter.getProfile(userId);
    if (!profile) {
      return {
        shouldTarget: false,
        reasons: ['Profile not found'],
        suggestedPowerups: []
      };
    }

    const reasons: string[] = [];
    const suggestedPowerups: string[] = [];
    let shouldTarget = false;

    // Target users with low stats
    if (profile.gameStats.service < 10) {
      reasons.push('Low service stats');
      suggestedPowerups.push('super_sugar_boost');
      shouldTarget = true;
    }

    if (profile.gameStats.marketing < 10) {
      reasons.push('Low marketing stats');
      suggestedPowerups.push('super_sugar_boost');
      shouldTarget = true;
    }

    // Target users with recent losses (negative profit)
    if (profile.progress.bestProfit < 0) {
      reasons.push('Recent losses');
      suggestedPowerups.push('super_sugar_boost');
      shouldTarget = true;
    }

    // Target users who haven't used power-ups recently
    const powerupStats = await this.getPowerupStats(userId);
    if (powerupStats.totalUsed === 0) {
      reasons.push('Never used power-ups');
      suggestedPowerups.push('super_sugar_boost');
      shouldTarget = true;
    }

    return {
      shouldTarget,
      reasons,
      suggestedPowerups: [...new Set(suggestedPowerups)] // Remove duplicates
    };
  }

  /**
   * Tracks power-up usage for analytics and limits
   */
  private async trackPowerupUsage(userId: string, receipt: PaymentReceipt): Promise<void> {
    // This would typically store detailed usage analytics
    // For now, we'll just log the usage
    console.log(`Power-up used: ${receipt.sku} by user ${userId}`);
  }

  /**
   * Gets power-up effect preview for UI
   */
  getPowerupPreview(sku: string): {
    name: string;
    description: string;
    effects: string[];
    price: number;
    currency: string;
  } | null {
    const powerupConfig = this.config.payments.powerups[sku];
    if (!powerupConfig) {
      return null;
    }

    const effectStrings: string[] = [];
    
    if (powerupConfig.effects.type === 'SUPER_SUGAR') {
      effectStrings.push(`+${Math.round(powerupConfig.effects.demandBonus * 100)}% customer demand`);
      effectStrings.push(`+${powerupConfig.effects.serviceBonus} service quality boost`);
      effectStrings.push('Effects last for one game run');
    }

    return {
      name: this.getPowerupName(sku),
      description: this.getPowerupDescription(sku),
      effects: effectStrings,
      price: powerupConfig.price,
      currency: powerupConfig.currency
    };
  }

  /**
   * Validates power-up receipts before game run
   */
  async validatePowerupReceipts(receipts: PaymentReceipt[]): Promise<{
    valid: PaymentReceipt[];
    invalid: Array<{ receipt: PaymentReceipt; reason: string }>;
  }> {
    const valid: PaymentReceipt[] = [];
    const invalid: Array<{ receipt: PaymentReceipt; reason: string }> = [];

    for (const receipt of receipts) {
      const verification = await this.paymentService.verifyReceipt(receipt.receiptId);
      
      if (!verification.valid) {
        invalid.push({
          receipt,
          reason: verification.reason || 'Invalid receipt'
        });
      } else {
        valid.push(receipt);
      }
    }

    return { valid, invalid };
  }

  /**
   * Gets user-friendly power-up name
   */
  private getPowerupName(sku: string): string {
    const names: Record<string, string> = {
      'super_sugar_boost': 'Super Sugar Boost'
    };
    return names[sku] || sku;
  }

  /**
   * Gets power-up description
   */
  private getPowerupDescription(sku: string): string {
    const descriptions: Record<string, string> = {
      'super_sugar_boost': 'Premium sugar blend that enhances your lemonade quality and attracts more customers'
    };
    return descriptions[sku] || 'Power-up enhancement';
  }

  /**
   * Processes power-up receipts for game run
   */
  async processPowerups(userId: string, receiptIds: string[]): Promise<{
    success: boolean;
    receipts?: any[];
    error?: string;
  }> {
    try {
      const receipts = [];
      
      for (const receiptId of receiptIds) {
        const verification = await this.paymentService.verifyReceipt(receiptId);
        
        if (!verification.valid) {
          return {
            success: false,
            error: `Invalid receipt: ${receiptId}`
          };
        }
        
        receipts.push(verification.receipt);
      }
      
      return {
        success: true,
        receipts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process power-ups'
      };
    }
  }

  /**
   * Gets daily limit for a power-up SKU
   */
  getDailyLimit(sku: string): number {
    const limits: Record<string, number> = {
      'super_sugar': 3,
      'perfect_day': 1,
      'free_ad': 5
    };
    return limits[sku] || 1;
  }

  /**
   * Checks if user can use a specific power-up (simplified version)
   */
  async canUsePowerupSimple(userId: string, sku: string): Promise<boolean> {
    const result = await this.canUsePowerup(userId, sku);
    return result.allowed;
  }
}

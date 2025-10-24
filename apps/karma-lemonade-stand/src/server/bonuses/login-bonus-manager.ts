import { LoginBonusType } from '../../shared/types/game';
import { SeedGenerator } from '../engine/seed-generator';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';

export interface LoginBonus {
  type: LoginBonusType;
  description: string;
  effect: string;
  duration: number; // hours
  claimed: boolean;
  expiresAt: Date;
}

export class LoginBonusManager {
  private seedGenerator: SeedGenerator;
  private userProfileAdapter: UserProfileAdapter;

  constructor(userProfileAdapter: UserProfileAdapter) {
    this.seedGenerator = new SeedGenerator();
    this.userProfileAdapter = userProfileAdapter;
  }

  /**
   * Generates the daily login bonus for a specific date
   */
  generateDailyBonus(date: Date): LoginBonusType {
    const dateString = this.formatDate(date);
    const seed = this.generateDailySeed(dateString);
    
    const bonusProbabilities = {
      [LoginBonusType.NONE]: 0.6,
      [LoginBonusType.PERFECT]: 0.15,
      [LoginBonusType.FREE_AD]: 0.15,
      [LoginBonusType.COOLER]: 0.1
    };

    const random = this.seedGenerator.createSeededRandom(seed + '_bonus')();
    let cumulative = 0;

    for (const [bonus, probability] of Object.entries(bonusProbabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return bonus as LoginBonusType;
      }
    }

    return LoginBonusType.NONE; // Fallback
  }

  /**
   * Gets the current daily login bonus
   */
  getCurrentDailyBonus(): LoginBonusType {
    return this.generateDailyBonus(new Date());
  }

  /**
   * Claims the daily login bonus for a user
   */
  async claimDailyBonus(userId: string): Promise<LoginBonus | null> {
    try {
      const profile = await this.userProfileAdapter.getProfile(userId);
      if (!profile) {
        return null;
      }

      const today = this.formatDate(new Date());
      const bonusType = this.getCurrentDailyBonus();

      // Check if user already claimed today's bonus
      const existingBonus = await this.getUserBonus(userId);
      if (existingBonus && existingBonus.claimed && this.formatDate(existingBonus.expiresAt) === today) {
        return existingBonus;
      }

      // Create new bonus
      const bonus = this.createBonusFromType(bonusType);
      
      // Store bonus in user profile
      await this.storeBonusInProfile(userId, bonus);

      return bonus;
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return null;
    }
  }

  /**
   * Gets the user's current login bonus
   */
  async getUserBonus(userId: string): Promise<LoginBonus | null> {
    try {
      const profile = await this.userProfileAdapter.getProfile(userId);
      if (!profile) {
        return null;
      }

      // Check if user has a stored bonus
      const bonusData = (profile as any).loginBonus;
      if (!bonusData) {
        return null;
      }

      const bonus: LoginBonus = {
        type: bonusData.type,
        description: bonusData.description,
        effect: bonusData.effect,
        duration: bonusData.duration,
        claimed: bonusData.claimed,
        expiresAt: new Date(bonusData.expiresAt)
      };

      // Check if bonus has expired
      if (bonus.expiresAt < new Date()) {
        await this.clearExpiredBonus(userId);
        return null;
      }

      return bonus;
    } catch (error) {
      console.error('Error getting user bonus:', error);
      return null;
    }
  }

  /**
   * Checks if a user has an active bonus of a specific type
   */
  async hasActiveBonus(userId: string, bonusType: LoginBonusType): Promise<boolean> {
    const bonus = await this.getUserBonus(userId);
    return bonus !== null && bonus.type === bonusType && bonus.claimed;
  }

  /**
   * Applies bonus effects to game calculations
   */
  async applyBonusEffects(userId: string, gameResult: { profit: number; cupsSold: number }): Promise<{ profit: number; cupsSold: number; bonusApplied?: string }> {
    const bonus = await this.getUserBonus(userId);
    
    if (!bonus || !bonus.claimed) {
      return gameResult;
    }

    let modifiedResult = { ...gameResult };
    let bonusApplied = '';

    switch (bonus.type) {
      case LoginBonusType.PERFECT:
        // 15% revenue boost
        modifiedResult.profit = Math.round(gameResult.profit * 1.15 * 100) / 100;
        bonusApplied = 'Perfect Day Bonus: +15% revenue';
        break;
      
      case LoginBonusType.FREE_AD:
        // This would be handled in the advertising system
        // For now, we'll just note it was applied
        bonusApplied = 'Free Advertising: +2 ad credits used';
        break;
      
      case LoginBonusType.COOLER:
        // This would be handled in weather effects
        // The bonus prevents cold weather penalties
        bonusApplied = 'Cooler Bonus: Cold weather ignored';
        break;
      
      default:
        return gameResult;
    }

    return {
      ...modifiedResult,
      bonusApplied
    };
  }

  /**
   * Checks if user can claim today's bonus
   */
  async canClaimTodaysBonus(userId: string): Promise<boolean> {
    const existingBonus = await this.getUserBonus(userId);
    const today = this.formatDate(new Date());
    
    // Can claim if no bonus exists or if existing bonus is from a different day
    return !existingBonus || 
           !existingBonus.claimed || 
           this.formatDate(existingBonus.expiresAt) !== today;
  }

  /**
   * Gets bonus information without claiming it
   */
  async previewTodaysBonus(): Promise<LoginBonus> {
    const bonusType = this.getCurrentDailyBonus();
    return this.createBonusFromType(bonusType);
  }

  /**
   * Creates a LoginBonus object from a bonus type
   */
  private createBonusFromType(bonusType: LoginBonusType): LoginBonus {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(23, 59, 59, 999); // Expires at end of day

    const bonusConfig = {
      [LoginBonusType.NONE]: {
        description: 'No bonus today',
        effect: 'No special effects'
      },
      [LoginBonusType.PERFECT]: {
        description: 'Perfect Day',
        effect: '+15% revenue boost'
      },
      [LoginBonusType.FREE_AD]: {
        description: 'Free Advertising',
        effect: '+2 free advertising credits'
      },
      [LoginBonusType.COOLER]: {
        description: 'Cooler Weather',
        effect: 'Ignore cold weather penalties'
      }
    };

    const config = bonusConfig[bonusType];

    return {
      type: bonusType,
      description: config.description,
      effect: config.effect,
      duration: 24,
      claimed: false,
      expiresAt
    };
  }

  /**
   * Stores bonus in user profile
   */
  private async storeBonusInProfile(userId: string, bonus: LoginBonus): Promise<void> {
    const bonusData = {
      type: bonus.type,
      description: bonus.description,
      effect: bonus.effect,
      duration: bonus.duration,
      claimed: true,
      expiresAt: bonus.expiresAt.toISOString()
    };

    await this.userProfileAdapter.updateProfile(userId, {
      loginBonus: bonusData
    } as any);
  }

  /**
   * Clears expired bonus from user profile
   */
  private async clearExpiredBonus(userId: string): Promise<void> {
    await this.userProfileAdapter.updateProfile(userId, {
      loginBonus: null
    } as any);
  }

  /**
   * Generates a deterministic seed for a specific date
   */
  private generateDailySeed(dateString: string): string {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Formats date as YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] || '';
  }

  /**
   * Gets time until next bonus reset (midnight UTC)
   */
  getTimeUntilNextBonus(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    return nextMidnight.getTime() - now.getTime();
  }

  /**
   * Gets bonus statistics for analytics
   */
  async getBonusStats(): Promise<{
    todaysBonus: LoginBonusType;
    timeUntilNext: number;
    bonusDistribution: Record<LoginBonusType, number>;
  }> {
    const todaysBonus = this.getCurrentDailyBonus();
    const timeUntilNext = this.getTimeUntilNextBonus();
    
    // Calculate bonus distribution for the next 7 days
    const bonusDistribution: Record<LoginBonusType, number> = {
      [LoginBonusType.NONE]: 0,
      [LoginBonusType.PERFECT]: 0,
      [LoginBonusType.FREE_AD]: 0,
      [LoginBonusType.COOLER]: 0
    };

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const bonus = this.generateDailyBonus(date);
      bonusDistribution[bonus]++;
    }

    return {
      todaysBonus,
      timeUntilNext,
      bonusDistribution
    };
  }
}

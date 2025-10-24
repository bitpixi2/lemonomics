import type { RedditUserData, UserStats } from '../../shared/types/game.js';
import type { GameConfig } from '../../shared/types/config.js';

/**
 * Service for converting Reddit user statistics to game statistics
 * Applies configurable ratios and validation to ensure balanced gameplay
 */
export class StatConverter {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * Convert Reddit user data to game stats
   * @param redditData - Raw Reddit user data
   * @returns UserStats with converted game statistics
   */
  convertRedditStatsToGameStats(redditData: RedditUserData): UserStats {
    const { statScaling } = this.config;

    // Calculate raw converted stats
    const rawService = this.calculateServiceLevel(redditData.commentKarma, statScaling.ckToService);
    const rawMarketing = this.calculateMarketingLevel(redditData.postKarma, statScaling.pkToMarketing);
    const rawReputation = this.calculateReputationLevel(
      this.calculateAccountAgeDays(redditData.accountCreated),
      statScaling.ageDaysToRep
    );

    // Apply validation and bounds checking
    const service = this.validateAndBoundStat(rawService, 'service');
    const marketing = this.validateAndBoundStat(rawMarketing, 'marketing');
    const reputation = this.validateAndBoundStat(rawReputation, 'reputation');

    return {
      postKarma: redditData.postKarma,
      commentKarma: redditData.commentKarma,
      accountAgeDays: this.calculateAccountAgeDays(redditData.accountCreated),
      awards: redditData.totalAwards,
      service,
      marketing,
      reputation,
    };
  }

  /**
   * Calculate service level from comment karma
   * Service represents customer service skills and customer satisfaction
   * @param commentKarma - Reddit comment karma
   * @param ratio - Conversion ratio from config
   * @returns Service level (0-10)
   */
  private calculateServiceLevel(commentKarma: number, ratio: number): number {
    // Comment karma reflects engagement and helpfulness in discussions
    // Higher comment karma = better customer service skills
    const baseService = Math.sqrt(Math.max(0, commentKarma)) * ratio;
    
    // Apply logarithmic scaling to prevent extreme values
    return Math.log10(baseService * 10 + 1) * 2;
  }

  /**
   * Calculate marketing level from post karma
   * Marketing represents ability to attract customers and create buzz
   * @param postKarma - Reddit post karma
   * @param ratio - Conversion ratio from config
   * @returns Marketing level (0-10)
   */
  private calculateMarketingLevel(postKarma: number, ratio: number): number {
    // Post karma reflects ability to create engaging content
    // Higher post karma = better marketing and customer attraction
    const baseMarketing = Math.sqrt(Math.max(0, postKarma)) * ratio;
    
    // Apply logarithmic scaling to prevent extreme values
    return Math.log10(baseMarketing * 10 + 1) * 2;
  }

  /**
   * Calculate reputation level from account age
   * Reputation represents trustworthiness and business experience
   * @param accountAgeDays - Account age in days
   * @param ratio - Conversion ratio from config
   * @returns Reputation level (0-10)
   */
  private calculateReputationLevel(accountAgeDays: number, ratio: number): number {
    // Account age reflects experience and trustworthiness
    // Older accounts = more established reputation
    const baseReputation = accountAgeDays * ratio;
    
    // Apply square root scaling to give diminishing returns for very old accounts
    return Math.sqrt(baseReputation) * 2;
  }

  /**
   * Calculate account age in days from creation date
   * @param accountCreated - Account creation date
   * @returns Age in days
   */
  private calculateAccountAgeDays(accountCreated: Date): number {
    const now = new Date();
    const ageMs = now.getTime() - accountCreated.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate and apply bounds checking to converted stats
   * Ensures all stats are within reasonable ranges for gameplay balance
   * @param rawStat - Raw calculated stat value
   * @param statType - Type of stat for logging purposes
   * @returns Bounded stat value (0-10)
   */
  private validateAndBoundStat(rawStat: number, statType: string): number {
    // Check for invalid values
    if (!Number.isFinite(rawStat) || Number.isNaN(rawStat)) {
      console.warn(`Invalid ${statType} stat calculated: ${rawStat}, defaulting to 0`);
      return 0;
    }

    // Apply bounds (0-10 scale)
    const bounded = Math.max(0, Math.min(10, rawStat));
    
    // Log if bounds were applied
    if (bounded !== rawStat) {
      console.debug(`${statType} stat bounded from ${rawStat} to ${bounded}`);
    }

    // Round to 2 decimal places for consistency
    return Math.round(bounded * 100) / 100;
  }

  /**
   * Get stat scaling ratios from configuration
   * @returns Current stat scaling configuration
   */
  public getStatScalingConfig() {
    return {
      commentKarmaToService: this.config.statScaling.ckToService,
      postKarmaToMarketing: this.config.statScaling.pkToMarketing,
      accountAgeDaysToReputation: this.config.statScaling.ageDaysToRep,
    };
  }

  /**
   * Update configuration (for dynamic config updates)
   * @param newConfig - Updated game configuration
   */
  public updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
  }

  /**
   * Calculate stat tier for display purposes
   * Converts numeric stat (0-10) to tier name
   * @param statValue - Numeric stat value (0-10)
   * @returns Tier name string
   */
  public getStatTier(statValue: number): string {
    if (statValue >= 9) return 'Legendary';
    if (statValue >= 8) return 'Master';
    if (statValue >= 7) return 'Expert';
    if (statValue >= 6) return 'Advanced';
    if (statValue >= 5) return 'Intermediate';
    if (statValue >= 4) return 'Competent';
    if (statValue >= 3) return 'Novice';
    if (statValue >= 2) return 'Beginner';
    if (statValue >= 1) return 'Rookie';
    return 'New';
  }

  /**
   * Get detailed stat breakdown for debugging/display
   * @param redditData - Reddit user data
   * @returns Detailed breakdown of stat calculations
   */
  public getStatBreakdown(redditData: RedditUserData): {
    reddit: RedditUserData;
    calculated: UserStats;
    breakdown: {
      service: { source: 'commentKarma'; value: number; ratio: number; tier: string };
      marketing: { source: 'postKarma'; value: number; ratio: number; tier: string };
      reputation: { source: 'accountAge'; value: number; ratio: number; tier: string };
    };
  } {
    const calculated = this.convertRedditStatsToGameStats(redditData);
    const { statScaling } = this.config;

    return {
      reddit: redditData,
      calculated,
      breakdown: {
        service: {
          source: 'commentKarma',
          value: calculated.service,
          ratio: statScaling.ckToService,
          tier: this.getStatTier(calculated.service),
        },
        marketing: {
          source: 'postKarma',
          value: calculated.marketing,
          ratio: statScaling.pkToMarketing,
          tier: this.getStatTier(calculated.marketing),
        },
        reputation: {
          source: 'accountAge',
          value: calculated.reputation,
          ratio: statScaling.ageDaysToRep,
          tier: this.getStatTier(calculated.reputation),
        },
      },
    };
  }

  /**
   * Check if user qualifies for power-up offers based on stats
   * Users with all zero stats or recent losses qualify for assistance
   * @param stats - User's game stats
   * @returns Whether user qualifies for power-up offers
   */
  public qualifiesForPowerupOffer(stats: UserStats): boolean {
    // Check if all core stats are zero (new/inactive user)
    const hasZeroStats = stats.service === 0 && stats.marketing === 0 && stats.reputation === 0;
    
    if (hasZeroStats) {
      return true;
    }

    // Additional qualification logic would be added here
    // (e.g., checking for recent consecutive losses)
    // This would require access to user's game history
    
    return false;
  }
}

/**
 * Create a stat converter instance with the provided configuration
 * @param config - Game configuration
 * @returns StatConverter instance
 */
export function createStatConverter(config: GameConfig): StatConverter {
  return new StatConverter(config);
}

import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter';
import { PaymentReceipt, LeaderboardEntry } from '../../shared/types/game';

export interface GameRunResult {
  userId: string;
  username: string;
  score: number;
  powerupReceipts?: PaymentReceipt[];
}

export interface LeaderboardDisplay {
  rank: number;
  username: string;
  score: number;
  powerupUsed: boolean;
  powerupTypes?: string[];
  isPureLeague: boolean;
}

export class PureLeagueService {
  private leaderboardAdapter: LeaderboardAdapter;

  constructor(leaderboardAdapter: LeaderboardAdapter) {
    this.leaderboardAdapter = leaderboardAdapter;
  }

  /**
   * Adds a score to both regular and pure leaderboards
   */
  async addScore(result: GameRunResult): Promise<{
    addedToRegular: boolean;
    addedToPure: boolean;
    powerupUsed: boolean;
    powerupTypes: string[];
  }> {
    const powerupUsed = this.hasPowerupUsage(result.powerupReceipts);
    const powerupTypes = this.extractPowerupTypes(result.powerupReceipts);

    // Always add to regular leaderboard
    const addedToRegular = await this.leaderboardAdapter.addScore(
      result.userId,
      result.username,
      result.score,
      powerupUsed
    );

    // Only add to pure leaderboard if no power-ups were used
    let addedToPure = false;
    if (!powerupUsed) {
      // The addScore method already handles pure leaderboard when powerupUsed is false
      addedToPure = true;
    }

    return {
      addedToRegular,
      addedToPure,
      powerupUsed,
      powerupTypes
    };
  }

  /**
   * Gets combined leaderboard display with power-up indicators
   */
  async getLeaderboardDisplay(
    type: 'daily' | 'weekly',
    limit: number = 10,
    showPureOnly: boolean = false
  ): Promise<LeaderboardDisplay[]> {
    const entries = await this.leaderboardAdapter.getTopEntries(type, limit, showPureOnly);
    
    return entries.map(entry => ({
      rank: entry.rank,
      username: entry.username,
      score: entry.score,
      powerupUsed: entry.powerupUsed,
      powerupTypes: this.getPowerupTypesFromEntry(entry),
      isPureLeague: showPureOnly
    }));
  }

  /**
   * Gets user's ranking in both regular and pure leagues
   */
  async getUserRankings(userId: string, type: 'daily' | 'weekly'): Promise<{
    regularRank: number | null;
    regularScore: number | null;
    pureRank: number | null;
    pureScore: number | null;
    qualifiesForPure: boolean;
  }> {
    const regularRank = await this.leaderboardAdapter.getUserRank(userId, type, false);
    const regularScore = await this.leaderboardAdapter.getUserScore(userId, type, false);
    const pureRank = await this.leaderboardAdapter.getUserRank(userId, type, true);
    const pureScore = await this.leaderboardAdapter.getUserScore(userId, type, true);

    return {
      regularRank,
      regularScore,
      pureRank,
      pureScore,
      qualifiesForPure: pureRank !== null
    };
  }

  /**
   * Gets leaderboard statistics comparing regular vs pure leagues
   */
  async getLeaderboardComparison(type: 'daily' | 'weekly'): Promise<{
    regular: {
      totalEntries: number;
      topScore: number;
      averageScore: number;
      powerupUsageRate: number;
    };
    pure: {
      totalEntries: number;
      topScore: number;
      averageScore: number;
    };
    competitiveness: {
      scoreDifference: number;
      pureParticipationRate: number;
    };
  }> {
    const regularEntries = await this.leaderboardAdapter.getTopEntries(type, 50, false);
    const pureEntries = await this.leaderboardAdapter.getTopEntries(type, 50, true);

    // Calculate regular league stats
    const regularStats = this.calculateLeaderboardStats(regularEntries);
    const powerupUsageRate = regularEntries.length > 0 
      ? regularEntries.filter(e => e.powerupUsed).length / regularEntries.length 
      : 0;

    // Calculate pure league stats
    const pureStats = this.calculateLeaderboardStats(pureEntries);

    // Calculate competitiveness metrics
    const topRegularScore = regularEntries[0]?.score || 0;
    const topPureScore = pureEntries[0]?.score || 0;
    const scoreDifference = topRegularScore - topPureScore;
    const pureParticipationRate = regularEntries.length > 0 
      ? pureEntries.length / regularEntries.length 
      : 0;

    return {
      regular: {
        ...regularStats,
        powerupUsageRate
      },
      pure: pureStats,
      competitiveness: {
        scoreDifference,
        pureParticipationRate
      }
    };
  }

  /**
   * Marks a game run result with power-up indicators for display
   */
  markGameResult(result: GameRunResult): {
    score: number;
    powerupUsed: boolean;
    powerupIndicators: Array<{
      type: string;
      icon: string;
      description: string;
    }>;
    leagueEligibility: {
      regular: boolean;
      pure: boolean;
    };
  } {
    const powerupUsed = this.hasPowerupUsage(result.powerupReceipts);
    const powerupTypes = this.extractPowerupTypes(result.powerupReceipts);
    
    const powerupIndicators = powerupTypes.map(type => ({
      type,
      icon: this.getPowerupIcon(type),
      description: this.getPowerupDescription(type)
    }));

    return {
      score: result.score,
      powerupUsed,
      powerupIndicators,
      leagueEligibility: {
        regular: true, // Always eligible for regular league
        pure: !powerupUsed // Only eligible for pure league if no power-ups used
      }
    };
  }

  /**
   * Gets power-up usage trends for analytics
   */
  async getPowerupUsageTrends(_type: 'daily' | 'weekly', days: number = 7): Promise<{
    dates: string[];
    powerupUsageRates: number[];
    pureParticipationRates: number[];
    averageScoreDifferences: number[];
  }> {
    // This would typically query historical data
    // For now, we'll return placeholder data
    const dates: string[] = [];
    const powerupUsageRates: number[] = [];
    const pureParticipationRates: number[] = [];
    const averageScoreDifferences: number[] = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dates.push(dateString);
      
      // Placeholder data - in real implementation, this would query historical leaderboards
      powerupUsageRates.push(0.3 + Math.random() * 0.4); // 30-70% usage rate
      pureParticipationRates.push(0.4 + Math.random() * 0.3); // 40-70% participation
      averageScoreDifferences.push(Math.random() * 50); // 0-50 point difference
    }

    return {
      dates,
      powerupUsageRates,
      pureParticipationRates,
      averageScoreDifferences
    };
  }

  /**
   * Checks if power-ups were used in a game run
   */
  private hasPowerupUsage(receipts?: PaymentReceipt[]): boolean {
    return receipts !== undefined && receipts.length > 0;
  }

  /**
   * Extracts power-up types from receipts
   */
  private extractPowerupTypes(receipts?: PaymentReceipt[]): string[] {
    if (!receipts || receipts.length === 0) {
      return [];
    }

    // Extract SKUs and convert to power-up types
    return receipts.map(receipt => {
      // Map SKU to power-up type (this could be more sophisticated)
      if (receipt.sku === 'super_sugar_boost') {
        return 'SUPER_SUGAR';
      }
      return 'UNKNOWN';
    });
  }

  /**
   * Gets power-up types from leaderboard entry (if stored)
   */
  private getPowerupTypesFromEntry(entry: LeaderboardEntry): string[] {
    // In a full implementation, this would extract power-up types from stored data
    // For now, we'll return a placeholder
    return entry.powerupUsed ? ['SUPER_SUGAR'] : [];
  }

  /**
   * Calculates statistics for a set of leaderboard entries
   */
  private calculateLeaderboardStats(entries: LeaderboardEntry[]): {
    totalEntries: number;
    topScore: number;
    averageScore: number;
  } {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        topScore: 0,
        averageScore: 0
      };
    }

    const scores = entries.map(e => e.score);
    const topScore = Math.max(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      totalEntries: entries.length,
      topScore,
      averageScore: Math.round(averageScore * 100) / 100
    };
  }

  /**
   * Gets icon for power-up type
   */
  private getPowerupIcon(type: string): string {
    const icons: Record<string, string> = {
      'SUPER_SUGAR': '🍯',
      'UNKNOWN': '⚡'
    };
    return icons[type] || '❓';
  }

  /**
   * Gets description for power-up type
   */
  private getPowerupDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'SUPER_SUGAR': 'Super Sugar Boost - Enhanced demand and service',
      'UNKNOWN': 'Unknown power-up effect'
    };
    return descriptions[type] || 'Unknown power-up';
  }
}

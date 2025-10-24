import { UserProfile, GameResult } from '../../shared/types/game.js';

export interface PersonalBestData {
  bestProfit: number;
  totalRuns: number;
  lastPlayDate: string;
}

export class PersonalBestTracker {
  /**
   * Updates personal best scores and run statistics
   */
  static updatePersonalBest(profile: UserProfile, gameResult: GameResult): PersonalBestData {
    const currentBest = profile.progress.bestProfit || 0;
    const totalRuns = (profile.progress.totalRuns || 0) + 1;
    const today: string = new Date().toISOString().split('T')[0];
    
    const newBest = Math.max(currentBest, gameResult.profit);
    
    return {
      bestProfit: newBest,
      totalRuns,
      lastPlayDate: today
    };
  }
  
  /**
   * Gets personal statistics for display
   */
  static getPersonalStats(profile: UserProfile): {
    bestProfit: number;
    totalRuns: number;
    lastPlayDate: string | null;
    averageProfit: number;
  } {
    const totalRuns = profile.progress.totalRuns || 0;
    const totalProfit = profile.progress.totalProfit || 0;
    
    return {
      bestProfit: profile.progress.bestProfit || 0,
      totalRuns,
      lastPlayDate: profile.progress.lastPlayDate ?? null,
      averageProfit: totalRuns > 0 ? Math.round((totalProfit / totalRuns) * 100) / 100 : 0
    };
  }
  
  /**
   * Checks if this is a new personal best
   */
  static isNewPersonalBest(profile: UserProfile, profit: number): boolean {
    const currentBest = profile.progress.bestProfit || 0;
    return profit > currentBest;
  }
}

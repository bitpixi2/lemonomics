import { UserProfile, GameResult } from '../../shared/types/game.js';
import { StreakTracker, StreakData } from './streak-tracker.js';
import { PersonalBestTracker, PersonalBestData } from './personal-best-tracker.js';

export interface ProgressUpdate {
  streak: StreakData;
  personalBest: PersonalBestData;
  isNewBest: boolean;
  streakMilestone?: number | undefined; // If streak hit a milestone (5, 10, 25, 50, 100)
}

export class ProgressService {
  private static readonly STREAK_MILESTONES = [5, 10, 25, 50, 100];
  
  /**
   * Updates all progress tracking for a user after a game run
   */
  static updateProgress(profile: UserProfile, gameResult: GameResult): ProgressUpdate {
    const streak = StreakTracker.updateStreak(profile);
    const personalBest = PersonalBestTracker.updatePersonalBest(profile, gameResult);
    const isNewBest = PersonalBestTracker.isNewPersonalBest(profile, gameResult.profit);
    
    // Check for streak milestones
    const previousStreak = profile.progress.currentStreak || 0;
    const streakMilestone = this.getStreakMilestone(previousStreak, streak.currentStreak);
    
    return {
      streak,
      personalBest,
      isNewBest,
      streakMilestone
    };
  }
  
  /**
   * Gets complete progress summary for a user
   */
  static getProgressSummary(profile: UserProfile): {
    streak: ReturnType<typeof StreakTracker.getStreakStatus>;
    stats: ReturnType<typeof PersonalBestTracker.getPersonalStats>;
    nextMilestone: number | null;
  } {
    const streak = StreakTracker.getStreakStatus(profile);
    const stats = PersonalBestTracker.getPersonalStats(profile);
    const nextMilestone = this.getNextStreakMilestone(streak.current);
    
    return {
      streak,
      stats,
      nextMilestone
    };
  }
  
  /**
   * Checks if a streak milestone was reached
   */
  private static getStreakMilestone(previousStreak: number, currentStreak: number): number | undefined {
    for (const milestone of this.STREAK_MILESTONES) {
      if (previousStreak < milestone && currentStreak >= milestone) {
        return milestone;
      }
    }
    return undefined;
  }
  
  /**
   * Gets the next streak milestone to reach
   */
  private static getNextStreakMilestone(currentStreak: number): number | null {
    for (const milestone of this.STREAK_MILESTONES) {
      if (currentStreak < milestone) {
        return milestone;
      }
    }
    return null; // Already reached all milestones
  }
}

import { UserProfile, GameResult } from '../../shared/types/game.js';
import { StreakTracker, StreakData } from './streak-tracker.js';
import { PersonalBestTracker, PersonalBestData } from './personal-best-tracker.js';
export interface ProgressUpdate {
    streak: StreakData;
    personalBest: PersonalBestData;
    isNewBest: boolean;
    streakMilestone?: number | undefined;
}
export declare class ProgressService {
    private static readonly STREAK_MILESTONES;
    /**
     * Updates all progress tracking for a user after a game run
     */
    static updateProgress(profile: UserProfile, gameResult: GameResult): ProgressUpdate;
    /**
     * Gets complete progress summary for a user
     */
    static getProgressSummary(profile: UserProfile): {
        streak: ReturnType<typeof StreakTracker.getStreakStatus>;
        stats: ReturnType<typeof PersonalBestTracker.getPersonalStats>;
        nextMilestone: number | null;
    };
    /**
     * Checks if a streak milestone was reached
     */
    private static getStreakMilestone;
    /**
     * Gets the next streak milestone to reach
     */
    private static getNextStreakMilestone;
}

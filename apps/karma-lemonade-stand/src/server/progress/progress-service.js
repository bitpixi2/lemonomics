import { StreakTracker } from './streak-tracker.js';
import { PersonalBestTracker } from './personal-best-tracker.js';
export class ProgressService {
    static STREAK_MILESTONES = [5, 10, 25, 50, 100];
    /**
     * Updates all progress tracking for a user after a game run
     */
    static updateProgress(profile, gameResult) {
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
    static getProgressSummary(profile) {
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
    static getStreakMilestone(previousStreak, currentStreak) {
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
    static getNextStreakMilestone(currentStreak) {
        for (const milestone of this.STREAK_MILESTONES) {
            if (currentStreak < milestone) {
                return milestone;
            }
        }
        return null; // Already reached all milestones
    }
}
//# sourceMappingURL=progress-service.js.map
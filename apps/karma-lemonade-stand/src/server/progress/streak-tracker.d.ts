import { UserProfile } from '../../shared/types/game.js';
export interface StreakData {
    currentStreak: number;
    lastPlayDate: string;
    longestStreak: number;
}
export declare class StreakTracker {
    /**
     * Updates user streak based on current play date
     * Uses UTC boundaries for consistent streak calculation
     */
    static updateStreak(profile: UserProfile): StreakData;
    /**
     * Checks if user has played today
     */
    static hasPlayedToday(profile: UserProfile): boolean;
    /**
     * Gets streak status for display
     */
    static getStreakStatus(profile: UserProfile): {
        current: number;
        longest: number;
        playedToday: boolean;
    };
}

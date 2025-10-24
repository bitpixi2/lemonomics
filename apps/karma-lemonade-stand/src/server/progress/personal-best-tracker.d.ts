import { UserProfile, GameResult } from '../../shared/types/game.js';
export interface PersonalBestData {
    bestProfit: number;
    totalRuns: number;
    lastPlayDate: string;
}
export declare class PersonalBestTracker {
    /**
     * Updates personal best scores and run statistics
     */
    static updatePersonalBest(profile: UserProfile, gameResult: GameResult): PersonalBestData;
    /**
     * Gets personal statistics for display
     */
    static getPersonalStats(profile: UserProfile): {
        bestProfit: number;
        totalRuns: number;
        lastPlayDate: string | null;
        averageProfit: number;
    };
    /**
     * Checks if this is a new personal best
     */
    static isNewPersonalBest(profile: UserProfile, profit: number): boolean;
}

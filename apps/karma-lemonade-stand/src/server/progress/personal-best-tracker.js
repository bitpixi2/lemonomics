export class PersonalBestTracker {
    /**
     * Updates personal best scores and run statistics
     */
    static updatePersonalBest(profile, gameResult) {
        const currentBest = profile.progress.bestProfit || 0;
        const totalRuns = (profile.progress.totalRuns || 0) + 1;
        const today = new Date().toISOString().split('T')[0];
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
    static getPersonalStats(profile) {
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
    static isNewPersonalBest(profile, profit) {
        const currentBest = profile.progress.bestProfit || 0;
        return profit > currentBest;
    }
}
//# sourceMappingURL=personal-best-tracker.js.map
export class StreakTracker {
    /**
     * Updates user streak based on current play date
     * Uses UTC boundaries for consistent streak calculation
     */
    static updateStreak(profile) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const lastPlay = profile.progress.lastPlayDate;
        let currentStreak = profile.progress.currentStreak || 0;
        let longestStreak = profile.progress.longestStreak || 0;
        if (!lastPlay || lastPlay === undefined) {
            // First time playing
            currentStreak = 1;
        }
        else {
            const lastPlayDate = new Date(lastPlay);
            const todayDate = new Date(today);
            const daysDiff = Math.floor((todayDate.getTime() - lastPlayDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0) {
                // Same day, no streak change
                return {
                    currentStreak,
                    lastPlayDate: today,
                    longestStreak
                };
            }
            else if (daysDiff === 1) {
                // Consecutive day, increment streak
                currentStreak += 1;
            }
            else {
                // Missed days, reset streak
                currentStreak = 1;
            }
        }
        // Update longest streak if current is higher
        longestStreak = Math.max(longestStreak, currentStreak);
        return {
            currentStreak,
            lastPlayDate: today,
            longestStreak
        };
    }
    /**
     * Checks if user has played today
     */
    static hasPlayedToday(profile) {
        const today = new Date().toISOString().split('T')[0];
        return profile.progress.lastPlayDate === today;
    }
    /**
     * Gets streak status for display
     */
    static getStreakStatus(profile) {
        return {
            current: profile.progress.currentStreak || 0,
            longest: profile.progress.longestStreak || 0,
            playedToday: this.hasPlayedToday(profile)
        };
    }
}
//# sourceMappingURL=streak-tracker.js.map
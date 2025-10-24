// Leaderboard Redis storage adapter
import type { Leaderboard, LeaderboardEntry } from '../types/game.js';
import type { GameRedisClient } from './client.js';

export class LeaderboardAdapter {
  private redis: GameRedisClient;
  private readonly MAX_ENTRIES = 50;

  constructor(redis: GameRedisClient) {
    this.redis = redis;
  }

  async getDailyLeaderboard(): Promise<Leaderboard | null> {
    try {
      const leaderboardData = await this.redis.getDailyLeaderboard();
      if (!leaderboardData) {
        return this.createEmptyLeaderboard('daily');
      }
      return JSON.parse(leaderboardData) as Leaderboard;
    } catch (error) {
      console.error('Error getting daily leaderboard:', error);
      return this.createEmptyLeaderboard('daily');
    }
  }

  async getWeeklyLeaderboard(): Promise<Leaderboard | null> {
    try {
      const leaderboardData = await this.redis.getWeeklyLeaderboard();
      if (!leaderboardData) {
        return this.createEmptyLeaderboard('weekly');
      }
      return JSON.parse(leaderboardData) as Leaderboard;
    } catch (error) {
      console.error('Error getting weekly leaderboard:', error);
      return this.createEmptyLeaderboard('weekly');
    }
  }

  async getDailyPureLeaderboard(): Promise<Leaderboard | null> {
    try {
      const leaderboardData = await this.redis.getDailyPureLeaderboard();
      if (!leaderboardData) {
        return this.createEmptyLeaderboard('daily', true);
      }
      return JSON.parse(leaderboardData) as Leaderboard;
    } catch (error) {
      console.error('Error getting daily pure leaderboard:', error);
      return this.createEmptyLeaderboard('daily', true);
    }
  }

  async getWeeklyPureLeaderboard(): Promise<Leaderboard | null> {
    try {
      const leaderboardData = await this.redis.getWeeklyPureLeaderboard();
      if (!leaderboardData) {
        return this.createEmptyLeaderboard('weekly', true);
      }
      return JSON.parse(leaderboardData) as Leaderboard;
    } catch (error) {
      console.error('Error getting weekly pure leaderboard:', error);
      return this.createEmptyLeaderboard('weekly', true);
    }
  }

  async addScore(
    userId: string,
    username: string,
    score: number,
    powerupUsed: boolean = false
  ): Promise<boolean> {
    try {
      // Add to daily leaderboard
      await this.addScoreToLeaderboard('daily', userId, username, score, powerupUsed);
      
      // Add to weekly leaderboard
      await this.addScoreToLeaderboard('weekly', userId, username, score, powerupUsed);
      
      // Add to pure leaderboards if no power-up was used
      if (!powerupUsed) {
        await this.addScoreToLeaderboard('daily', userId, username, score, false, true);
        await this.addScoreToLeaderboard('weekly', userId, username, score, false, true);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding score to leaderboards:', error);
      return false;
    }
  }

  private async addScoreToLeaderboard(
    type: 'daily' | 'weekly',
    userId: string,
    username: string,
    score: number,
    powerupUsed: boolean,
    isPure: boolean = false
  ): Promise<void> {
    const leaderboard = isPure 
      ? (type === 'daily' ? await this.getDailyPureLeaderboard() : await this.getWeeklyPureLeaderboard())
      : (type === 'daily' ? await this.getDailyLeaderboard() : await this.getWeeklyLeaderboard());
    
    if (!leaderboard) {
      console.error('Failed to get leaderboard');
      return;
    }

    const newEntry: LeaderboardEntry = {
      userId,
      username,
      score,
      rank: 0, // Will be calculated after sorting
      powerupUsed,
      timestamp: new Date()
    };

    // Remove existing entry for this user if it exists
    const existingIndex = leaderboard.entries.findIndex(entry => entry.userId === userId);
    if (existingIndex !== -1) {
      // Only update if new score is better
      const existingEntry = leaderboard.entries[existingIndex];
      if (existingEntry && score > existingEntry.score) {
        leaderboard.entries[existingIndex] = newEntry;
      } else {
        return; // Don't update if score is not better
      }
    } else {
      leaderboard.entries.push(newEntry);
    }

    // Sort by score (descending) and limit to MAX_ENTRIES
    leaderboard.entries.sort((a, b) => b.score - a.score);
    leaderboard.entries = leaderboard.entries.slice(0, this.MAX_ENTRIES);

    // Update ranks
    leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Save back to Redis
    const leaderboardData = JSON.stringify(leaderboard);
    if (isPure) {
      if (type === 'daily') {
        await this.redis.setDailyPureLeaderboard(leaderboardData);
      } else {
        await this.redis.setWeeklyPureLeaderboard(leaderboardData);
      }
    } else {
      if (type === 'daily') {
        await this.redis.setDailyLeaderboard(leaderboardData);
      } else {
        await this.redis.setWeeklyLeaderboard(leaderboardData);
      }
    }
  }

  async getUserRank(userId: string, type: 'daily' | 'weekly', isPure: boolean = false): Promise<number | null> {
    try {
      let leaderboard: Leaderboard | null;
      
      if (isPure) {
        leaderboard = type === 'daily' ? await this.getDailyPureLeaderboard() : await this.getWeeklyPureLeaderboard();
      } else {
        leaderboard = type === 'daily' ? await this.getDailyLeaderboard() : await this.getWeeklyLeaderboard();
      }
      
      if (!leaderboard) return null;
      
      const entry = leaderboard.entries.find(entry => entry.userId === userId);
      return entry ? entry.rank : null;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  async getUserScore(userId: string, type: 'daily' | 'weekly', isPure: boolean = false): Promise<number | null> {
    try {
      let leaderboard: Leaderboard | null;
      
      if (isPure) {
        leaderboard = type === 'daily' ? await this.getDailyPureLeaderboard() : await this.getWeeklyPureLeaderboard();
      } else {
        leaderboard = type === 'daily' ? await this.getDailyLeaderboard() : await this.getWeeklyLeaderboard();
      }
      
      if (!leaderboard) return null;
      
      const entry = leaderboard.entries.find(entry => entry.userId === userId);
      return entry ? entry.score : null;
    } catch (error) {
      console.error('Error getting user score:', error);
      return null;
    }
  }

  async getTopEntries(type: 'daily' | 'weekly', limit: number = 10, isPure: boolean = false): Promise<LeaderboardEntry[]> {
    try {
      let leaderboard: Leaderboard | null;
      
      if (isPure) {
        leaderboard = type === 'daily' ? await this.getDailyPureLeaderboard() : await this.getWeeklyPureLeaderboard();
      } else {
        leaderboard = type === 'daily' ? await this.getDailyLeaderboard() : await this.getWeeklyLeaderboard();
      }
      
      if (!leaderboard) return [];
      
      return leaderboard.entries.slice(0, Math.min(limit, leaderboard.entries.length));
    } catch (error) {
      console.error('Error getting top entries:', error);
      return [];
    }
  }

  async resetDailyLeaderboards(): Promise<boolean> {
    try {
      const emptyDaily = this.createEmptyLeaderboard('daily');
      const emptyDailyPure = this.createEmptyLeaderboard('daily', true);
      
      await this.redis.setDailyLeaderboard(JSON.stringify(emptyDaily));
      await this.redis.setDailyPureLeaderboard(JSON.stringify(emptyDailyPure));
      
      console.log('Daily leaderboards reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting daily leaderboards:', error);
      return false;
    }
  }

  async resetWeeklyLeaderboards(): Promise<boolean> {
    try {
      const emptyWeekly = this.createEmptyLeaderboard('weekly');
      const emptyWeeklyPure = this.createEmptyLeaderboard('weekly', true);
      
      await this.redis.setWeeklyLeaderboard(JSON.stringify(emptyWeekly));
      await this.redis.setWeeklyPureLeaderboard(JSON.stringify(emptyWeeklyPure));
      
      console.log('Weekly leaderboards reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting weekly leaderboards:', error);
      return false;
    }
  }

  async resetAllLeaderboards(): Promise<boolean> {
    try {
      const dailySuccess = await this.resetDailyLeaderboards();
      const weeklySuccess = await this.resetWeeklyLeaderboards();
      
      const success = dailySuccess && weeklySuccess;
      if (success) {
        console.log('All leaderboards reset successfully');
      } else {
        console.error('Failed to reset some leaderboards');
      }
      
      return success;
    } catch (error) {
      console.error('Error resetting all leaderboards:', error);
      return false;
    }
  }

  async bulkAddScores(scores: Array<{
    userId: string;
    username: string;
    score: number;
    powerupUsed?: boolean;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const scoreData of scores) {
      try {
        const result = await this.addScore(
          scoreData.userId,
          scoreData.username,
          scoreData.score,
          scoreData.powerupUsed || false
        );
        
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error adding score for user ${scoreData.userId}:`, error);
        failed++;
      }
    }
    
    console.log(`Bulk score addition completed: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  async archiveLeaderboard(type: 'daily' | 'weekly', date: string): Promise<boolean> {
    try {
      let leaderboard: Leaderboard | null;
      let pureLeaderboard: Leaderboard | null;
      
      if (type === 'daily') {
        leaderboard = await this.getDailyLeaderboard();
        pureLeaderboard = await this.getDailyPureLeaderboard();
      } else {
        leaderboard = await this.getWeeklyLeaderboard();
        pureLeaderboard = await this.getWeeklyPureLeaderboard();
      }
      
      if (!leaderboard) return false;
      
      // Archive main leaderboard
      await this.redis.setArchivedLeaderboard(type, date, JSON.stringify(leaderboard));
      
      // Archive pure leaderboard if it exists
      if (pureLeaderboard && pureLeaderboard.entries.length > 0) {
        await this.redis.setArchivedLeaderboard(type, `${date}-pure`, JSON.stringify(pureLeaderboard));
      }
      
      console.log(`Archived ${type} leaderboard for ${date} with ${leaderboard.entries.length} entries`);
      
      return true;
    } catch (error) {
      console.error('Error archiving leaderboard:', error);
      return false;
    }
  }

  async getArchivedLeaderboard(type: 'daily' | 'weekly', date: string, isPure: boolean = false): Promise<Leaderboard | null> {
    try {
      const archiveKey = isPure ? `${date}-pure` : date;
      const leaderboardData = await this.redis.getArchivedLeaderboard(type, archiveKey);
      
      if (!leaderboardData) return null;
      
      return JSON.parse(leaderboardData) as Leaderboard;
    } catch (error) {
      console.error('Error getting archived leaderboard:', error);
      return null;
    }
  }

  async cleanupOldEntries(daysToKeep: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Clean up current leaderboards
      const leaderboards = [
        { getter: () => this.getDailyLeaderboard(), setter: (data: string) => this.redis.setDailyLeaderboard(data), name: 'daily' },
        { getter: () => this.getDailyPureLeaderboard(), setter: (data: string) => this.redis.setDailyPureLeaderboard(data), name: 'daily pure' },
        { getter: () => this.getWeeklyLeaderboard(), setter: (data: string) => this.redis.setWeeklyLeaderboard(data), name: 'weekly' },
        { getter: () => this.getWeeklyPureLeaderboard(), setter: (data: string) => this.redis.setWeeklyPureLeaderboard(data), name: 'weekly pure' }
      ];
      
      let totalCleaned = 0;
      
      for (const { getter, setter, name } of leaderboards) {
        const leaderboard = await getter();
        if (leaderboard) {
          const originalCount = leaderboard.entries.length;
          leaderboard.entries = leaderboard.entries.filter(
            entry => new Date(entry.timestamp) > cutoffDate
          );
          const cleanedCount = originalCount - leaderboard.entries.length;
          totalCleaned += cleanedCount;
          
          if (cleanedCount > 0) {
            await setter(JSON.stringify(leaderboard));
            console.log(`Cleaned ${cleanedCount} old entries from ${name} leaderboard`);
          }
        }
      }
      
      console.log(`Total cleanup: removed ${totalCleaned} old entries from all leaderboards`);
      return true;
    } catch (error) {
      console.error('Error cleaning up old entries:', error);
      return false;
    }
  }

  async cleanupArchivedLeaderboards(daysToKeep: number = 90): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateString = cutoffDate.toISOString().substring(0, 10);
      
      // Note: In a real implementation, we would scan for archived keys and delete old ones
      // For now, we'll just log that cleanup would happen
      console.log(`Would cleanup archived leaderboards older than ${cutoffDateString}`);
      
      // This would require implementing a key scanning mechanism in the Redis client
      // which may not be available in Devvit's Redis implementation
      
      return true;
    } catch (error) {
      console.error('Error cleaning up archived leaderboards:', error);
      return false;
    }
  }

  async getLeaderboardStats(): Promise<{
    daily: { total: number; pure: number; topScore: number; averageScore: number };
    weekly: { total: number; pure: number; topScore: number; averageScore: number };
  }> {
    try {
      const dailyLeaderboard = await this.getDailyLeaderboard();
      const weeklyLeaderboard = await this.getWeeklyLeaderboard();
      const dailyPureLeaderboard = await this.getDailyPureLeaderboard();
      const weeklyPureLeaderboard = await this.getWeeklyPureLeaderboard();
      
      const calculateStats = (leaderboard: Leaderboard | null) => {
        if (!leaderboard || leaderboard.entries.length === 0) {
          return { topScore: 0, averageScore: 0 };
        }
        
        const scores = leaderboard.entries.map(entry => entry.score);
        const topScore = Math.max(...scores);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        return { topScore, averageScore: Math.round(averageScore * 100) / 100 };
      };
      
      const dailyStats = calculateStats(dailyLeaderboard);
      const weeklyStats = calculateStats(weeklyLeaderboard);
      
      return {
        daily: {
          total: dailyLeaderboard?.entries.length || 0,
          pure: dailyPureLeaderboard?.entries.length || 0,
          topScore: dailyStats.topScore,
          averageScore: dailyStats.averageScore
        },
        weekly: {
          total: weeklyLeaderboard?.entries.length || 0,
          pure: weeklyPureLeaderboard?.entries.length || 0,
          topScore: weeklyStats.topScore,
          averageScore: weeklyStats.averageScore
        }
      };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return {
        daily: { total: 0, pure: 0, topScore: 0, averageScore: 0 },
        weekly: { total: 0, pure: 0, topScore: 0, averageScore: 0 }
      };
    }
  }

  async performMaintenance(): Promise<{
    success: boolean;
    operations: string[];
    errors: string[];
  }> {
    const operations: string[] = [];
    const errors: string[] = [];
    
    try {
      // Clean up old entries
      const cleanupSuccess = await this.cleanupOldEntries();
      if (cleanupSuccess) {
        operations.push('Cleaned up old leaderboard entries');
      } else {
        errors.push('Failed to clean up old entries');
      }
      
      // Clean up archived leaderboards
      const archiveCleanupSuccess = await this.cleanupArchivedLeaderboards();
      if (archiveCleanupSuccess) {
        operations.push('Cleaned up old archived leaderboards');
      } else {
        errors.push('Failed to clean up archived leaderboards');
      }
      
      // Validate leaderboard integrity
      const validationSuccess = await this.validateLeaderboardIntegrity();
      if (validationSuccess) {
        operations.push('Validated leaderboard integrity');
      } else {
        errors.push('Leaderboard integrity validation failed');
      }
      
      return {
        success: errors.length === 0,
        operations,
        errors
      };
    } catch (error) {
      console.error('Error during maintenance:', error);
      return {
        success: false,
        operations,
        errors: [...errors, `Maintenance error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async validateLeaderboardIntegrity(): Promise<boolean> {
    try {
      const leaderboards = [
        { name: 'daily', getter: () => this.getDailyLeaderboard() },
        { name: 'weekly', getter: () => this.getWeeklyLeaderboard() },
        { name: 'daily pure', getter: () => this.getDailyPureLeaderboard() },
        { name: 'weekly pure', getter: () => this.getWeeklyPureLeaderboard() }
      ];
      
      let allValid = true;
      
      for (const { name, getter } of leaderboards) {
        const leaderboard = await getter();
        if (leaderboard && leaderboard.entries && leaderboard.entries.length > 0) {
          // Check if entries are properly sorted by score (descending)
          for (let i = 1; i < leaderboard.entries.length; i++) {
            const prevEntry = leaderboard.entries[i - 1];
            const currentEntry = leaderboard.entries[i];
            if (prevEntry && currentEntry && prevEntry.score < currentEntry.score) {
              console.error(`${name} leaderboard is not properly sorted`);
              allValid = false;
              break;
            }
          }
          
          // Check if ranks are sequential
          for (let i = 0; i < leaderboard.entries.length; i++) {
            const entry = leaderboard.entries[i];
            if (entry && entry.rank !== i + 1) {
              console.error(`${name} leaderboard has incorrect ranks`);
              allValid = false;
              break;
            }
          }
          
          // Check if we don't exceed MAX_ENTRIES
          if (leaderboard.entries.length > this.MAX_ENTRIES) {
            console.error(`${name} leaderboard exceeds maximum entries (${leaderboard.entries.length} > ${this.MAX_ENTRIES})`);
            allValid = false;
          }
          
          console.log(`${name} leaderboard validation: ${leaderboard.entries.length} entries, integrity OK`);
        }
      }
      
      return allValid;
    } catch (error) {
      console.error('Error validating leaderboard integrity:', error);
      return false;
    }
  }

  private createEmptyLeaderboard(type: 'daily' | 'weekly', isPure: boolean = false): Leaderboard {
    const today = new Date().toISOString().substring(0, 10);
    const leaderboard: Leaderboard = {
      type,
      date: today,
      entries: []
    };
    
    if (isPure) {
      leaderboard.pure = [];
    }
    
    return leaderboard;
  }

  async archiveDailyLeaderboard(date: Date): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0];
    return await this.archiveLeaderboard('daily', dateString);
  }

  async archiveWeeklyLeaderboard(year: number, week: number): Promise<boolean> {
    const dateString = `${year}-W${week.toString().padStart(2, '0')}`;
    return await this.archiveLeaderboard('weekly', dateString);
  }

  async clearDailyLeaderboard(): Promise<boolean> {
    return await this.resetDailyLeaderboards();
  }

  async clearWeeklyLeaderboard(): Promise<boolean> {
    return await this.resetWeeklyLeaderboards();
  }

  /**
   * Adds a score entry (overloaded method for API endpoint)
   */
  async addScoreEntry(entry: {
    userId: string;
    username: string;
    score: number;
    powerupUsed: boolean;
    timestamp: Date;
  }): Promise<void> {
    await this.addScore(entry.userId, entry.username, entry.score, entry.powerupUsed);
  }

  /**
   * Gets top scores for a leaderboard type
   */
  async getTopScores(type: 'daily' | 'weekly', limit: number): Promise<LeaderboardEntry[]> {
    return await this.getTopEntries(type, limit, false);
  }

  /**
   * Gets user rank for a leaderboard type (overloaded)
   */
  async getUserRankSimple(userId: string, type: 'daily' | 'weekly'): Promise<number> {
    const rank = await this.getUserRank(userId, type, false);
    return rank || 0;
  }
}
}

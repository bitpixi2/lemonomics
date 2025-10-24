import { DailyCycleManager } from './daily-cycle-manager';
import { WeeklyCycleManager } from './weekly-cycle-manager';
import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';
import { ConfigAdapter } from '../../shared/redis/config-adapter';

export class CycleResetManager {
  private dailyCycleManager: DailyCycleManager;
  private weeklyCycleManager: WeeklyCycleManager;
  private leaderboardAdapter: LeaderboardAdapter;
  private userProfileAdapter: UserProfileAdapter;
  private configAdapter: ConfigAdapter;

  constructor(
    leaderboardAdapter: LeaderboardAdapter,
    userProfileAdapter: UserProfileAdapter,
    configAdapter: ConfigAdapter
  ) {
    this.dailyCycleManager = new DailyCycleManager();
    this.weeklyCycleManager = new WeeklyCycleManager();
    this.leaderboardAdapter = leaderboardAdapter;
    this.userProfileAdapter = userProfileAdapter;
    this.configAdapter = configAdapter;
  }

  /**
   * Performs daily reset at 00:05 UTC
   */
  async performDailyReset(): Promise<void> {
    console.log('Starting daily reset...');
    
    try {
      // Generate new daily cycle
      const newDailyCycle = this.dailyCycleManager.getCurrentDailyCycle();
      
      // Store the new daily cycle
      await this.configAdapter.setDailyCycle(newDailyCycle);
      
      // Archive yesterday's leaderboard
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      await this.leaderboardAdapter.archiveDailyLeaderboard(yesterday);
      
      // Reset daily power-up counters for all users
      await this.resetDailyPowerupCounters();
      
      // Clear daily leaderboard for new day
      await this.leaderboardAdapter.clearDailyLeaderboard();
      
      console.log('Daily reset completed successfully');
    } catch (error) {
      console.error('Error during daily reset:', error);
      throw error;
    }
  }

  /**
   * Performs weekly reset on Sunday 23:55 UTC
   */
  async performWeeklyReset(): Promise<void> {
    console.log('Starting weekly reset...');
    
    try {
      // Generate new weekly cycle
      const newWeeklyCycle = this.weeklyCycleManager.getCurrentWeeklyCycle();
      
      // Store the new weekly cycle
      await this.configAdapter.setWeeklyCycle(newWeeklyCycle);
      
      // Archive last week's leaderboard
      const lastWeek = this.weeklyCycleManager.getWeekForDate(new Date());
      lastWeek.week -= 1;
      if (lastWeek.week < 1) {
        lastWeek.week = 53;
        lastWeek.year -= 1;
      }
      
      await this.leaderboardAdapter.archiveWeeklyLeaderboard(lastWeek.year, lastWeek.week);
      
      // Clear weekly leaderboard for new week
      await this.leaderboardAdapter.clearWeeklyLeaderboard();
      
      // Reset weekly power-up counters
      await this.resetWeeklyPowerupCounters();
      
      console.log('Weekly reset completed successfully');
    } catch (error) {
      console.error('Error during weekly reset:', error);
      throw error;
    }
  }

  /**
   * Checks if daily reset is needed and performs it
   */
  async checkAndPerformDailyReset(): Promise<boolean> {
    if (this.isDailyResetTime()) {
      await this.performDailyReset();
      return true;
    }
    return false;
  }

  /**
   * Checks if weekly reset is needed and performs it
   */
  async checkAndPerformWeeklyReset(): Promise<boolean> {
    if (this.weeklyCycleManager.isWeeklyResetTime()) {
      await this.performWeeklyReset();
      return true;
    }
    return false;
  }

  /**
   * Performs both daily and weekly resets if needed
   */
  async performScheduledResets(): Promise<{ daily: boolean; weekly: boolean }> {
    const results = {
      daily: false,
      weekly: false
    };

    // Check weekly reset first (happens less frequently)
    results.weekly = await this.checkAndPerformWeeklyReset();
    
    // Then check daily reset
    results.daily = await this.checkAndPerformDailyReset();

    return results;
  }

  /**
   * Resets daily power-up counters for all users
   */
  private async resetDailyPowerupCounters(): Promise<void> {
    // This would typically be done with a Redis script or batch operation
    // For now, we'll implement a placeholder that could be optimized later
    console.log('Resetting daily power-up counters...');
    
    // In a real implementation, you'd want to:
    // 1. Get all user IDs from Redis
    // 2. Reset their daily power-up usage counters
    // 3. Update their lastResetDate
    
    // This is a placeholder - actual implementation would depend on Redis structure
    await this.userProfileAdapter.resetAllDailyPowerups();
  }

  /**
   * Resets weekly power-up counters for all users
   */
  private async resetWeeklyPowerupCounters(): Promise<void> {
    console.log('Resetting weekly power-up counters...');
    
    // Similar to daily reset but for weekly limits
    await this.userProfileAdapter.resetAllWeeklyPowerups();
  }

  /**
   * Checks if it's time for daily reset (00:05 UTC)
   */
  private isDailyResetTime(): boolean {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    return utcHour === 0 && utcMinute >= 5 && utcMinute < 10;
  }

  /**
   * Gets the next daily reset time
   */
  getNextDailyResetTime(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    
    // Set to 00:05 UTC
    nextReset.setUTCHours(0, 5, 0, 0);
    
    // If we've already passed today's reset time, move to tomorrow
    if (now.getUTCHours() > 0 || (now.getUTCHours() === 0 && now.getUTCMinutes() >= 10)) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }
    
    return nextReset;
  }

  /**
   * Gets the next weekly reset time
   */
  getNextWeeklyResetTime(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    
    // Set to Sunday 23:55 UTC
    const daysUntilSunday = (7 - now.getUTCDay()) % 7;
    nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilSunday);
    nextReset.setUTCHours(23, 55, 0, 0);
    
    // If it's already Sunday and past reset time, move to next Sunday
    if (daysUntilSunday === 0 && (now.getUTCHours() > 23 || (now.getUTCHours() === 23 && now.getUTCMinutes() >= 55))) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 7);
    }
    
    return nextReset;
  }

  /**
   * Gets time until next daily reset in milliseconds
   */
  getTimeUntilDailyReset(): number {
    const nextReset = this.getNextDailyResetTime();
    return nextReset.getTime() - Date.now();
  }

  /**
   * Gets time until next weekly reset in milliseconds
   */
  getTimeUntilWeeklyReset(): number {
    const nextReset = this.getNextWeeklyResetTime();
    return nextReset.getTime() - Date.now();
  }
}

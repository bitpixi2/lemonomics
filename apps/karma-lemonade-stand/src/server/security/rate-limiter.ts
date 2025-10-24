import { GameRedisClient } from '../../shared/redis/client';
import { GameConfig } from '../../shared/types/config';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds until next attempt allowed
  remainingAttempts?: number;
}

export interface RateLimitStatus {
  postsToday: number;
  maxPostsPerDay: number;
  remainingPosts: number;
  lastRunTime?: number;
  minSecondsBetweenRuns: number;
  secondsUntilNextRun: number;
}

export class RateLimiter {
  private redis: GameRedisClient;
  private config: GameConfig;

  constructor(redis: GameRedisClient, config: GameConfig) {
    this.redis = redis;
    this.config = config;
  }

  /**
   * Checks if a user can make a game run
   */
  async checkGameRunLimit(userId: string): Promise<RateLimitResult> {
    try {
      // Check daily post limit
      const dailyLimitCheck = await this.checkDailyPostLimit(userId);
      if (!dailyLimitCheck.allowed) {
        return dailyLimitCheck;
      }

      // Check minimum time between runs
      const timeLimitCheck = await this.checkTimeBetweenRuns(userId);
      if (!timeLimitCheck.allowed) {
        return timeLimitCheck;
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking rate limits:', error);
      return {
        allowed: false,
        reason: 'Rate limit check failed'
      };
    }
  }

  /**
   * Records a game run for rate limiting
   */
  async recordGameRun(userId: string): Promise<void> {
    try {
      const now = Date.now();
      
      // Update daily post count
      await this.incrementDailyPostCount(userId);
      
      // Record last run time
      await this.setLastRunTime(userId, now);
      
      console.log(`Recorded game run for user ${userId} at ${now}`);
    } catch (error) {
      console.error('Error recording game run:', error);
    }
  }

  /**
   * Gets current rate limit status for a user
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitStatus> {
    try {
      const postsToday = await this.getDailyPostCount(userId);
      const maxPostsPerDay = this.config.limits.maxPostsPerUserPerDay;
      const remainingPosts = Math.max(0, maxPostsPerDay - postsToday);
      
      const lastRunTime = await this.getLastRunTime(userId);
      const minSecondsBetweenRuns = this.config.limits.minSecondsBetweenRuns;
      
      let secondsUntilNextRun = 0;
      if (lastRunTime) {
        const timeSinceLastRun = Math.floor((Date.now() - lastRunTime) / 1000);
        secondsUntilNextRun = Math.max(0, minSecondsBetweenRuns - timeSinceLastRun);
      }

      return {
        postsToday,
        maxPostsPerDay,
        remainingPosts,
        lastRunTime: lastRunTime || undefined,
        minSecondsBetweenRuns,
        secondsUntilNextRun
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        postsToday: 0,
        maxPostsPerDay: this.config.limits.maxPostsPerUserPerDay,
        remainingPosts: this.config.limits.maxPostsPerUserPerDay,
        minSecondsBetweenRuns: this.config.limits.minSecondsBetweenRuns,
        secondsUntilNextRun: 0
      };
    }
  }

  /**
   * Resets daily limits for all users (called by daily reset)
   */
  async resetDailyLimits(): Promise<void> {
    try {
      // In a real implementation, this would scan and reset all user keys
      // For now, we'll log that the reset would happen
      console.log('Daily rate limits reset for all users');
    } catch (error) {
      console.error('Error resetting daily limits:', error);
    }
  }

  /**
   * Gets rate limit violations for monitoring
   */
  async getRateLimitViolations(hours: number = 24): Promise<Array<{
    userId: string;
    violationType: 'daily_limit' | 'time_limit';
    timestamp: number;
    attempts: number;
  }>> {
    // This would typically query violation logs from Redis
    // For now, we'll return an empty array as placeholder
    console.log(`Getting rate limit violations for last ${hours} hours`);
    return [];
  }

  /**
   * Checks daily post limit for a user
   */
  private async checkDailyPostLimit(userId: string): Promise<RateLimitResult> {
    const postsToday = await this.getDailyPostCount(userId);
    const maxPosts = this.config.limits.maxPostsPerUserPerDay;
    
    if (postsToday >= maxPosts) {
      const timeUntilReset = this.getTimeUntilDailyReset();
      return {
        allowed: false,
        reason: `Daily limit of ${maxPosts} posts exceeded`,
        retryAfter: Math.ceil(timeUntilReset / 1000),
        remainingAttempts: 0
      };
    }

    return {
      allowed: true,
      remainingAttempts: maxPosts - postsToday
    };
  }

  /**
   * Checks minimum time between runs
   */
  private async checkTimeBetweenRuns(userId: string): Promise<RateLimitResult> {
    const lastRunTime = await this.getLastRunTime(userId);
    const minSeconds = this.config.limits.minSecondsBetweenRuns;
    
    if (!lastRunTime) {
      return { allowed: true };
    }

    const timeSinceLastRun = Math.floor((Date.now() - lastRunTime) / 1000);
    
    if (timeSinceLastRun < minSeconds) {
      const retryAfter = minSeconds - timeSinceLastRun;
      return {
        allowed: false,
        reason: `Must wait ${minSeconds} seconds between runs`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  /**
   * Gets daily post count for a user
   */
  private async getDailyPostCount(userId: string): Promise<number> {
    try {
      const countStr = await this.redis.getRateLimitRuns(userId);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      console.error('Error getting daily post count:', error);
      return 0;
    }
  }

  /**
   * Increments daily post count for a user
   */
  private async incrementDailyPostCount(userId: string): Promise<void> {
    try {
      const currentCount = await this.getDailyPostCount(userId);
      const newCount = currentCount + 1;
      
      // Set with TTL until end of day
      const ttl = this.getSecondsUntilDailyReset();
      await this.redis.setRateLimitRuns(userId, newCount.toString(), ttl);
    } catch (error) {
      console.error('Error incrementing daily post count:', error);
    }
  }

  /**
   * Gets last run time for a user
   */
  private async getLastRunTime(userId: string): Promise<number | null> {
    try {
      const timeStr = await this.redis.get(`last_run:${userId}`);
      return timeStr ? parseInt(timeStr, 10) : null;
    } catch (error) {
      console.error('Error getting last run time:', error);
      return null;
    }
  }

  /**
   * Sets last run time for a user
   */
  private async setLastRunTime(userId: string, timestamp: number): Promise<void> {
    try {
      // Set with TTL of 1 hour (longer than max time between runs)
      await this.redis.set(`last_run:${userId}`, timestamp.toString());
      await this.redis.expire(`last_run:${userId}`, 3600);
    } catch (error) {
      console.error('Error setting last run time:', error);
    }
  }

  /**
   * Gets seconds until daily reset (midnight UTC)
   */
  private getSecondsUntilDailyReset(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    return Math.ceil((nextMidnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Gets milliseconds until daily reset
   */
  private getTimeUntilDailyReset(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    return nextMidnight.getTime() - now.getTime();
  }

  /**
   * Formats time remaining as human-readable string
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) {
      return 'Now';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Checks if a user is exhibiting suspicious behavior
   */
  async checkSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    try {
      // Check for rapid successive attempts
      const status = await this.getRateLimitStatus(userId);
      
      if (status.postsToday > status.maxPostsPerDay * 0.8) {
        reasons.push('High daily usage');
        riskLevel = 'medium';
      }

      if (status.secondsUntilNextRun > 0) {
        reasons.push('Attempting runs too quickly');
        riskLevel = 'high';
      }

      // Additional checks could include:
      // - Unusual score patterns
      // - Consistent perfect timing
      // - Abnormal game result distributions

      return {
        suspicious: reasons.length > 0,
        reasons,
        riskLevel
      };
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return {
        suspicious: false,
        reasons: [],
        riskLevel: 'low'
      };
    }
  }
}

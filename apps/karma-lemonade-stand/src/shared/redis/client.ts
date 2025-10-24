// Redis client wrapper for Devvit
import type { RedisClient } from '@devvit/web';

export class GameRedisClient {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  // Configuration keys
  async getGlobalConfig(): Promise<string | null> {
    return await this.redis.get('config:global');
  }

  async setGlobalConfig(config: string): Promise<void> {
    await this.redis.set('config:global', config);
  }

  // Cycle management keys
  async getCurrentDailyCycle(): Promise<string | null> {
    return await this.redis.get('cycle:today');
  }

  async setCurrentDailyCycle(cycle: string): Promise<void> {
    await this.redis.set('cycle:today', cycle);
  }

  async getCurrentWeeklyCycle(): Promise<string | null> {
    return await this.redis.get('cycle:week');
  }

  async setCurrentWeeklyCycle(cycle: string): Promise<void> {
    await this.redis.set('cycle:week', cycle);
  }

  // User data keys
  async getUserProfile(userId: string): Promise<string | null> {
    return await this.redis.get(`user:${userId}`);
  }

  async setUserProfile(userId: string, profile: string): Promise<void> {
    await this.redis.set(`user:${userId}`, profile);
  }

  async getUserPowerups(userId: string): Promise<string | null> {
    return await this.redis.get(`user:${userId}:powerups`);
  }

  async setUserPowerups(userId: string, powerups: string): Promise<void> {
    await this.redis.set(`user:${userId}:powerups`, powerups);
  }

  async getUserStreak(userId: string): Promise<string | null> {
    return await this.redis.get(`user:${userId}:streak`);
  }

  async setUserStreak(userId: string, streak: string): Promise<void> {
    await this.redis.set(`user:${userId}:streak`, streak);
  }

  async getUserHistory(userId: string): Promise<string | null> {
    return await this.redis.get(`user:${userId}:history`);
  }

  async setUserHistory(userId: string, history: string): Promise<void> {
    await this.redis.set(`user:${userId}:history`, history);
  }

  // Leaderboard keys
  async getDailyLeaderboard(): Promise<string | null> {
    return await this.redis.get('leaderboard:daily');
  }

  async setDailyLeaderboard(leaderboard: string): Promise<void> {
    await this.redis.set('leaderboard:daily', leaderboard);
  }

  async getWeeklyLeaderboard(): Promise<string | null> {
    return await this.redis.get('leaderboard:weekly');
  }

  async setWeeklyLeaderboard(leaderboard: string): Promise<void> {
    await this.redis.set('leaderboard:weekly', leaderboard);
  }

  async getDailyPureLeaderboard(): Promise<string | null> {
    return await this.redis.get('leaderboard:daily:pure');
  }

  async setDailyPureLeaderboard(leaderboard: string): Promise<void> {
    await this.redis.set('leaderboard:daily:pure', leaderboard);
  }

  async getWeeklyPureLeaderboard(): Promise<string | null> {
    return await this.redis.get('leaderboard:weekly:pure');
  }

  async setWeeklyPureLeaderboard(leaderboard: string): Promise<void> {
    await this.redis.set('leaderboard:weekly:pure', leaderboard);
  }

  // Archived leaderboard keys
  async getArchivedLeaderboard(type: 'daily' | 'weekly', date: string): Promise<string | null> {
    return await this.redis.get(`leaderboard:archive:${type}:${date}`);
  }

  async setArchivedLeaderboard(type: 'daily' | 'weekly', date: string, leaderboard: string): Promise<void> {
    await this.redis.set(`leaderboard:archive:${type}:${date}`, leaderboard);
  }

  async deleteArchivedLeaderboard(type: 'daily' | 'weekly', date: string): Promise<void> {
    await this.redis.del(`leaderboard:archive:${type}:${date}`);
  }

  // Get all archived leaderboard keys for cleanup
  async getArchivedLeaderboardKeys(_pattern: string): Promise<string[]> {
    // Note: This would need to be implemented with Redis SCAN in a real implementation
    // For now, we'll return an empty array as Devvit Redis may not support SCAN
    return [];
  }

  // Payment keys
  async getPaymentReceipt(receiptId: string): Promise<string | null> {
    return await this.redis.get(`purchases:${receiptId}`);
  }

  async setPaymentReceipt(receiptId: string, receipt: string): Promise<void> {
    await this.redis.set(`purchases:${receiptId}`, receipt);
  }

  // Rate limiting keys
  async getRateLimitRuns(userId: string): Promise<string | null> {
    return await this.redis.get(`rate_limit:${userId}:runs`);
  }

  async setRateLimitRuns(userId: string, count: string, ttl?: number): Promise<void> {
    await this.redis.set(`rate_limit:${userId}:runs`, count);
    if (ttl) {
      await this.redis.expire(`rate_limit:${userId}:runs`, ttl);
    }
  }

  async getRateLimitPurchases(userId: string): Promise<string | null> {
    return await this.redis.get(`rate_limit:${userId}:purchases`);
  }

  async setRateLimitPurchases(userId: string, count: string, ttl?: number): Promise<void> {
    await this.redis.set(`rate_limit:${userId}:purchases`, count);
    if (ttl) {
      await this.redis.expire(`rate_limit:${userId}:purchases`, ttl);
    }
  }

  // Utility methods
  async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result > 0;
  }

  // Generic get/set methods for cycle management
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }
}

// Simplified Redis client wrapper for Lemonomics
import { DEFAULT_CONFIG } from '../types/config.js';

// Simple Redis interface for our needs
interface SimpleRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
}

export class LemonomicsRedisClient {
  private redis: SimpleRedisClient;
  private keyPrefix: string;

  constructor(redis: SimpleRedisClient) {
    this.redis = redis;
    this.keyPrefix = DEFAULT_CONFIG.redis.keyPrefix;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  // User Profile Operations
  async getUserProfile(userId: string): Promise<string | null> {
    return await this.redis.get(this.getKey(`user:${userId}`));
  }

  async setUserProfile(userId: string, profile: string, ttl?: number): Promise<void> {
    const key = this.getKey(`user:${userId}`);
    await this.redis.set(key, profile);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  // Game Session Operations
  async getGameSession(sessionId: string): Promise<string | null> {
    return await this.redis.get(this.getKey(`session:${sessionId}`));
  }

  async setGameSession(sessionId: string, session: string, ttl?: number): Promise<void> {
    const key = this.getKey(`session:${sessionId}`);
    await this.redis.set(key, session);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  async deleteGameSession(sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(`session:${sessionId}`));
  }

  // Leaderboard Operations
  async getLeaderboard(): Promise<string | null> {
    return await this.redis.get(this.getKey('leaderboard'));
  }

  async setLeaderboard(leaderboard: string, ttl?: number): Promise<void> {
    const key = this.getKey('leaderboard');
    await this.redis.set(key, leaderboard);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  // Streak and Login Bonus Operations
  async getUserStreak(userId: string): Promise<string | null> {
    return await this.redis.get(this.getKey(`streak:${userId}`));
  }

  async setUserStreak(userId: string, streak: string, ttl?: number): Promise<void> {
    const key = this.getKey(`streak:${userId}`);
    await this.redis.set(key, streak);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  async getLastLoginBonus(userId: string): Promise<string | null> {
    return await this.redis.get(this.getKey(`login_bonus:${userId}`));
  }

  async setLastLoginBonus(userId: string, date: string): Promise<void> {
    const key = this.getKey(`login_bonus:${userId}`);
    await this.redis.set(key, date);
    // Set to expire at end of day (24 hours + buffer)
    await this.redis.expire(key, 86400 + 3600);
  }

  // Utility Methods
  async increment(key: string): Promise<number> {
    return await this.redis.incr(this.getKey(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(this.getKey(key));
    return result > 0;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.getKey(key));
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(this.getKey(key), seconds);
  }

  // Generic get/set for custom operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(this.getKey(key));
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    await this.redis.set(fullKey, value);
    if (ttl) {
      await this.redis.expire(fullKey, ttl);
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.redis.set(this.getKey('health_check'), 'ok');
      const result = await this.redis.get(this.getKey('health_check'));
      await this.redis.del(this.getKey('health_check'));
      return result === 'ok';
    } catch (error) {
      return false;
    }
  }
}

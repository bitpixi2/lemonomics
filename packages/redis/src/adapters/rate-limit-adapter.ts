/**
 * Rate Limit Redis Adapter
 * 
 * Implements sliding window rate limiting for various actions.
 */

import type { RedisClient } from '../client.js';
import { RedisKeyUtils } from '../keys/index.js';
import { getLuaScriptManager, type RateLimitResult } from '../lua/index.js';

export interface RateLimitConfig {
  windowSize: number; // milliseconds
  maxRequests: number;
}

export interface RateLimitCheck extends RateLimitResult {
  action: string;
  userId: string;
  windowSize: number;
  maxRequests: number;
}

export class RateLimitAdapter {
  private defaultConfigs: Record<string, RateLimitConfig> = {
    vote: { windowSize: 60000, maxRequests: 10 }, // 10 votes per minute
    submit: { windowSize: 300000, maxRequests: 3 }, // 3 submissions per 5 minutes
    component: { windowSize: 600000, maxRequests: 1 }, // 1 component per 10 minutes
  };

  constructor(private redisClient: RedisClient) {}

  /**
   * Check if action is allowed and update rate limit
   */
  async checkRateLimit(
    action: string,
    userId: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitCheck> {
    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    const finalConfig = {
      ...this.defaultConfigs[action],
      ...config,
    };

    if (!finalConfig.windowSize || !finalConfig.maxRequests) {
      throw new Error(`No rate limit configuration found for action: ${action}`);
    }

    return this.redisClient.execute(async (redis) => {
      const scriptManager = getLuaScriptManager();
      
      // Ensure scripts are loaded
      if (!scriptManager.areScriptsLoaded()) {
        await scriptManager.loadIntoRedis(redis);
      }

      const result = await scriptManager.executeRateLimit(redis, action, userId, {
        windowSize: finalConfig.windowSize,
        maxRequests: finalConfig.maxRequests,
      });

      return {
        ...result,
        action,
        userId,
        windowSize: finalConfig.windowSize,
        maxRequests: finalConfig.maxRequests,
      };
    }, `Rate limit check: ${action}`);
  }

  /**
   * Check if action is allowed without updating the counter
   */
  async isActionAllowed(
    action: string,
    userId: string,
    config?: Partial<RateLimitConfig>
  ): Promise<boolean> {
    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    const finalConfig = {
      ...this.defaultConfigs[action],
      ...config,
    };

    if (!finalConfig.windowSize || !finalConfig.maxRequests) {
      throw new Error(`No rate limit configuration found for action: ${action}`);
    }

    return this.redisClient.execute(async (redis) => {
      const rateLimitKey = `rl:${action}:${userId}`;
      const currentTime = Date.now();
      const windowStart = currentTime - finalConfig.windowSize;

      // Remove expired entries
      await redis.zremrangebyscore(rateLimitKey, '-inf', windowStart);

      // Count current requests
      const currentCount = await redis.zcard(rateLimitKey);

      return currentCount < finalConfig.maxRequests;
    }, `Check action allowed: ${action}`);
  }

  /**
   * Get current rate limit status for a user and action
   */
  async getRateLimitStatus(
    action: string,
    userId: string,
    config?: Partial<RateLimitConfig>
  ): Promise<{
    currentCount: number;
    maxRequests: number;
    windowSize: number;
    resetTime: number;
    allowed: boolean;
  }> {
    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    const finalConfig = {
      ...this.defaultConfigs[action],
      ...config,
    };

    if (!finalConfig.windowSize || !finalConfig.maxRequests) {
      throw new Error(`No rate limit configuration found for action: ${action}`);
    }

    return this.redisClient.execute(async (redis) => {
      const rateLimitKey = `rl:${action}:${userId}`;
      const currentTime = Date.now();
      const windowStart = currentTime - finalConfig.windowSize;

      // Remove expired entries
      await redis.zremrangebyscore(rateLimitKey, '-inf', windowStart);

      // Get current count and oldest entry
      const [currentCount, oldestEntries] = await Promise.all([
        redis.zcard(rateLimitKey),
        redis.zrange(rateLimitKey, 0, 0, 'WITHSCORES'),
      ]);

      // Calculate reset time
      let resetTime = currentTime + finalConfig.windowSize;
      if (oldestEntries.length > 0) {
        const oldestTime = parseInt(oldestEntries[1]);
        resetTime = oldestTime + finalConfig.windowSize;
      }

      return {
        currentCount,
        maxRequests: finalConfig.maxRequests,
        windowSize: finalConfig.windowSize,
        resetTime,
        allowed: currentCount < finalConfig.maxRequests,
      };
    }, `Get rate limit status: ${action}`);
  }

  /**
   * Reset rate limit for a user and action (admin operation)
   */
  async resetRateLimit(action: string, userId: string): Promise<void> {
    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const rateLimitKey = `rl:${action}:${userId}`;
      await redis.del(rateLimitKey);
    }, `Reset rate limit: ${action}`);
  }

  /**
   * Get all active rate limits for a user
   */
  async getUserRateLimits(userId: string): Promise<Array<{
    action: string;
    currentCount: number;
    maxRequests: number;
    resetTime: number;
    allowed: boolean;
  }>> {
    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    return this.redisClient.execute(async (redis) => {
      // Find all rate limit keys for this user
      const pattern = `rl:*:${userId}`;
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return [];
      }

      const results: Array<{
        action: string;
        currentCount: number;
        maxRequests: number;
        resetTime: number;
        allowed: boolean;
      }> = [];

      // Process each rate limit key
      for (const key of keys) {
        const actionMatch = key.match(/^rl:([^:]+):/);
        if (!actionMatch) {
          continue;
        }

        const action = actionMatch[1];
        const config = this.defaultConfigs[action];
        
        if (!config) {
          continue;
        }

        try {
          const status = await this.getRateLimitStatus(action, userId, config);
          results.push({
            action,
            currentCount: status.currentCount,
            maxRequests: status.maxRequests,
            resetTime: status.resetTime,
            allowed: status.allowed,
          });
        } catch (error) {
          console.warn(`Failed to get rate limit status for ${action}:`, error);
        }
      }

      return results;
    }, 'Get user rate limits');
  }

  /**
   * Clean up expired rate limit entries (maintenance operation)
   */
  async cleanupExpiredEntries(): Promise<number> {
    return this.redisClient.execute(async (redis) => {
      const pattern = 'rl:*';
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      let cleanedCount = 0;
      const currentTime = Date.now();

      // Process keys in batches to avoid blocking Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const pipeline = redis.pipeline();

        for (const key of batch) {
          // Extract action from key to get window size
          const actionMatch = key.match(/^rl:([^:]+):/);
          if (actionMatch) {
            const action = actionMatch[1];
            const config = this.defaultConfigs[action];
            if (config) {
              const windowStart = currentTime - config.windowSize;
              pipeline.zremrangebyscore(key, '-inf', windowStart);
            }
          }
        }

        const results = await pipeline.exec();
        if (results) {
          cleanedCount += results.reduce((sum, [error, count]) => {
            return sum + (error ? 0 : (count as number));
          }, 0);
        }
      }

      return cleanedCount;
    }, 'Cleanup expired rate limit entries');
  }

  /**
   * Update rate limit configuration for an action
   */
  setRateLimitConfig(action: string, config: RateLimitConfig): void {
    this.defaultConfigs[action] = { ...config };
  }

  /**
   * Get rate limit configuration for an action
   */
  getRateLimitConfig(action: string): RateLimitConfig | undefined {
    return this.defaultConfigs[action];
  }

  /**
   * Get all rate limit configurations
   */
  getAllRateLimitConfigs(): Record<string, RateLimitConfig> {
    return { ...this.defaultConfigs };
  }
}

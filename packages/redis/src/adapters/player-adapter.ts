/**
 * Player Redis Adapter
 * 
 * Typed data access layer for player statistics and progression.
 */

import type { PlayerStats } from '@bitpixis-bar/types';
import type { RedisClient } from '../client.js';
import { RedisKeys, type PlayerStatsData, RedisKeyUtils } from '../keys/index.js';

export interface UpdatePlayerStatsOptions {
  drinksCreated?: number;
  totalScore?: number;
  featuredDrinks?: string[];
  customComponentsCreated?: number;
}

export class PlayerAdapter {
  constructor(private redisClient: RedisClient) {}

  /**
   * Get player statistics
   */
  async getPlayerStats(uid: string): Promise<PlayerStats | null> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);
      const stats = await redis.hgetall(playerStatsKey);

      if (!stats || Object.keys(stats).length === 0) {
        return null;
      }

      // Parse featured drinks JSON array
      let featuredDrinks: string[] = [];
      if (stats.featuredDrinks) {
        try {
          featuredDrinks = JSON.parse(stats.featuredDrinks);
        } catch (error) {
          console.warn(`Failed to parse featured drinks for user ${uid}:`, error);
          featuredDrinks = [];
        }
      }

      return {
        uid,
        drinksCreated: parseInt(stats.drinksCreated) || 0,
        customComponentsUnlocked: stats.customComponentsUnlocked === 'true',
        totalScore: parseInt(stats.totalScore) || 0,
        featuredDrinks,
      };
    }, 'Get player stats');
  }

  /**
   * Initialize player statistics (called on first drink creation)
   */
  async initializePlayerStats(uid: string): Promise<PlayerStats> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);

      // Check if already exists
      const exists = await redis.exists(playerStatsKey);
      if (exists) {
        const existing = await this.getPlayerStats(uid);
        if (existing) {
          return existing;
        }
      }

      // Initialize with default values
      const initialStats: PlayerStatsData = {
        drinksCreated: 0,
        customComponentsUnlocked: false,
        totalScore: 0,
        featuredDrinks: '[]',
        customComponentsCreated: 0,
      };

      await redis.hset(playerStatsKey, initialStats);

      return {
        uid,
        drinksCreated: 0,
        customComponentsUnlocked: false,
        totalScore: 0,
        featuredDrinks: [],
      };
    }, 'Initialize player stats');
  }

  /**
   * Update player statistics
   */
  async updatePlayerStats(
    uid: string,
    updates: UpdatePlayerStatsOptions
  ): Promise<PlayerStats> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);

      // Ensure player stats exist
      await this.initializePlayerStats(uid);

      const multi = redis.multi();

      // Apply updates
      if (updates.drinksCreated !== undefined) {
        multi.hincrby(playerStatsKey, 'drinksCreated', updates.drinksCreated);
        
        // Unlock custom components after first drink
        if (updates.drinksCreated > 0) {
          multi.hset(playerStatsKey, 'customComponentsUnlocked', 'true');
        }
      }

      if (updates.totalScore !== undefined) {
        multi.hincrby(playerStatsKey, 'totalScore', updates.totalScore);
      }

      if (updates.featuredDrinks !== undefined) {
        multi.hset(playerStatsKey, 'featuredDrinks', JSON.stringify(updates.featuredDrinks));
      }

      if (updates.customComponentsCreated !== undefined) {
        multi.hincrby(playerStatsKey, 'customComponentsCreated', updates.customComponentsCreated);
      }

      await multi.exec();

      // Return updated stats
      const updatedStats = await this.getPlayerStats(uid);
      if (!updatedStats) {
        throw new Error(`Failed to retrieve updated stats for user ${uid}`);
      }

      return updatedStats;
    }, 'Update player stats');
  }

  /**
   * Add featured drink to player's list
   */
  async addFeaturedDrink(uid: string, drinkId: string): Promise<void> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);

      // Get current featured drinks
      const featuredDrinksJson = await redis.hget(playerStatsKey, 'featuredDrinks') || '[]';
      let featuredDrinks: string[];
      
      try {
        featuredDrinks = JSON.parse(featuredDrinksJson);
      } catch (error) {
        featuredDrinks = [];
      }

      // Add drink if not already in list
      if (!featuredDrinks.includes(drinkId)) {
        featuredDrinks.push(drinkId);
        await redis.hset(playerStatsKey, 'featuredDrinks', JSON.stringify(featuredDrinks));
      }
    }, 'Add featured drink');
  }

  /**
   * Remove featured drink from player's list (when demoted)
   */
  async removeFeaturedDrink(uid: string, drinkId: string): Promise<void> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);

      // Get current featured drinks
      const featuredDrinksJson = await redis.hget(playerStatsKey, 'featuredDrinks') || '[]';
      let featuredDrinks: string[];
      
      try {
        featuredDrinks = JSON.parse(featuredDrinksJson);
      } catch (error) {
        featuredDrinks = [];
      }

      // Remove drink from list
      const index = featuredDrinks.indexOf(drinkId);
      if (index > -1) {
        featuredDrinks.splice(index, 1);
        await redis.hset(playerStatsKey, 'featuredDrinks', JSON.stringify(featuredDrinks));
      }
    }, 'Remove featured drink');
  }

  /**
   * Get top players by total score
   */
  async getTopPlayers(limit = 10): Promise<Array<{ uid: string; totalScore: number; drinksCreated: number }>> {
    return this.redisClient.execute(async (redis) => {
      // Get all player stats keys
      const pattern = RedisKeys.playerStats('*');
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return [];
      }

      // Get all player stats in parallel
      const pipeline = redis.pipeline();
      keys.forEach(key => {
        pipeline.hgetall(key);
      });

      const results = await pipeline.exec();
      if (!results) {
        return [];
      }

      // Parse and sort players
      const players: Array<{ uid: string; totalScore: number; drinksCreated: number }> = [];

      for (let i = 0; i < results.length; i++) {
        const [error, stats] = results[i];
        if (error || !stats || typeof stats !== 'object') {
          continue;
        }

        const uid = RedisKeyUtils.extractUserId(keys[i]);
        if (!uid) {
          continue;
        }

        const playerStats = stats as Record<string, string>;
        players.push({
          uid,
          totalScore: parseInt(playerStats.totalScore) || 0,
          drinksCreated: parseInt(playerStats.drinksCreated) || 0,
        });
      }

      // Sort by total score (highest first) and limit
      return players
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);
    }, 'Get top players');
  }

  /**
   * Check if player has unlocked custom components
   */
  async hasUnlockedCustomComponents(uid: string): Promise<boolean> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);
      const unlocked = await redis.hget(playerStatsKey, 'customComponentsUnlocked');
      return unlocked === 'true';
    }, 'Check custom components unlock');
  }

  /**
   * Get player's drink creation count
   */
  async getDrinkCount(uid: string): Promise<number> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);
      const count = await redis.hget(playerStatsKey, 'drinksCreated');
      return parseInt(count || '0');
    }, 'Get drink count');
  }

  /**
   * Delete player statistics (admin operation)
   */
  async deletePlayerStats(uid: string): Promise<boolean> {
    if (!RedisKeyUtils.isValidUserId(uid)) {
      throw new Error(`Invalid user ID: ${uid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const playerStatsKey = RedisKeys.playerStats(uid);
      const deleted = await redis.del(playerStatsKey);
      return deleted === 1;
    }, 'Delete player stats');
  }
}

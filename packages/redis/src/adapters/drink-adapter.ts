/**
 * Drink Redis Adapter
 * 
 * Typed data access layer for drink operations with Redis.
 */

import type { Drink, DrinkState, ValidationResult } from '@bitpixis-bar/types';
import type { RedisClient } from '../client.js';
import { RedisKeys, type DrinkMetadata, RedisKeyUtils } from '../keys/index.js';
import { getLuaScriptManager, type VoteDrinkResult } from '../lua/index.js';

export interface SaveDrinkOptions {
  thumbUrl: string;
  authorUid: string;
  redditPostId?: string;
}

export interface GetDrinkResult {
  metadata: DrinkMetadata;
  recipe: Drink;
}

export interface VoteDrinkOptions {
  featuredThreshold?: number;
  retiredThreshold?: number;
}

export class DrinkAdapter {
  constructor(private redisClient: RedisClient) {}

  /**
   * Save a drink with metadata and recipe
   */
  async saveDrink(
    drink: Drink,
    options: SaveDrinkOptions
  ): Promise<string> {
    const drinkId = this.generateDrinkId(drink);
    
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    if (!RedisKeyUtils.isValidUserId(options.authorUid)) {
      throw new Error(`Invalid author UID: ${options.authorUid}`);
    }

    return this.redisClient.execute(async (redis) => {
      const drinkKey = RedisKeys.drink(drinkId);
      const drinkJsonKey = RedisKeys.drinkJson(drinkId);
      const pendingKey = RedisKeys.drinksPending;
      const playerStatsKey = RedisKeys.playerStats(options.authorUid);

      // Start transaction
      const multi = redis.multi();

      // Save drink metadata
      const metadata: DrinkMetadata = {
        state: 'PENDING',
        score: 0,
        authorUid: options.authorUid,
        thumbUrl: options.thumbUrl,
        createdAt: Date.now(),
        redditPostId: options.redditPostId,
      };

      multi.hset(drinkKey, metadata);

      // Save drink recipe as JSON
      multi.set(drinkJsonKey, JSON.stringify(drink));

      // Add to pending drinks list (sorted by creation time)
      multi.zadd(pendingKey, metadata.createdAt, drinkId);

      // Update player stats
      multi.hincrby(playerStatsKey, 'drinksCreated', 1);
      
      // Check if player should unlock custom components (after 1 drink)
      const currentDrinkCount = await redis.hget(playerStatsKey, 'drinksCreated');
      if (!currentDrinkCount || parseInt(currentDrinkCount) === 0) {
        multi.hset(playerStatsKey, 'customComponentsUnlocked', 'true');
      }

      // Execute transaction
      await multi.exec();

      return drinkId;
    }, 'Save drink');
  }

  /**
   * Get drink by ID with metadata and recipe
   */
  async getDrink(drinkId: string): Promise<GetDrinkResult | null> {
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const drinkKey = RedisKeys.drink(drinkId);
      const drinkJsonKey = RedisKeys.drinkJson(drinkId);

      // Get metadata and recipe in parallel
      const [metadataResult, recipeJson] = await Promise.all([
        redis.hgetall(drinkKey),
        redis.get(drinkJsonKey),
      ]);

      if (!metadataResult || Object.keys(metadataResult).length === 0 || !recipeJson) {
        return null;
      }

      // Parse metadata
      const metadata: DrinkMetadata = {
        state: metadataResult.state as DrinkMetadata['state'],
        score: parseInt(metadataResult.score) || 0,
        authorUid: metadataResult.authorUid,
        thumbUrl: metadataResult.thumbUrl,
        createdAt: parseInt(metadataResult.createdAt),
        redditPostId: metadataResult.redditPostId,
      };

      // Parse recipe
      const recipe: Drink = JSON.parse(recipeJson);

      return { metadata, recipe };
    }, 'Get drink');
  }

  /**
   * Vote on a drink using atomic Lua script
   */
  async voteDrink(
    drinkId: string,
    userId: string,
    voteDirection: 1 | -1,
    options: VoteDrinkOptions = {}
  ): Promise<VoteDrinkResult> {
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    return this.redisClient.execute(async (redis) => {
      // Get drink author for stats update
      const drinkKey = RedisKeys.drink(drinkId);
      const authorUid = await redis.hget(drinkKey, 'authorUid');
      
      if (!authorUid) {
        throw new Error(`Drink not found: ${drinkId}`);
      }

      // Execute vote using Lua script
      const scriptManager = getLuaScriptManager();
      
      // Ensure scripts are loaded
      if (!scriptManager.areScriptsLoaded()) {
        await scriptManager.loadIntoRedis(redis);
      }

      return scriptManager.executeVoteDrink(
        redis,
        drinkId,
        userId,
        voteDirection,
        authorUid,
        options
      );
    }, 'Vote on drink');
  }

  /**
   * Get featured drinks (top scored)
   */
  async getFeaturedDrinks(limit = 10): Promise<Array<{ drinkId: string; score: number }>> {
    return this.redisClient.execute(async (redis) => {
      const featuredKey = RedisKeys.drinksFeature;
      
      // Get top drinks with scores (highest first)
      const results = await redis.zrevrange(featuredKey, 0, limit - 1, 'WITHSCORES');
      
      const drinks: Array<{ drinkId: string; score: number }> = [];
      for (let i = 0; i < results.length; i += 2) {
        drinks.push({
          drinkId: results[i],
          score: parseInt(results[i + 1]),
        });
      }
      
      return drinks;
    }, 'Get featured drinks');
  }

  /**
   * Get pending drinks (newest first)
   */
  async getPendingDrinks(
    limit = 20,
    offset = 0
  ): Promise<Array<{ drinkId: string; createdAt: number }>> {
    return this.redisClient.execute(async (redis) => {
      const pendingKey = RedisKeys.drinksPending;
      
      // Get drinks sorted by creation time (newest first)
      const results = await redis.zrevrange(
        pendingKey,
        offset,
        offset + limit - 1,
        'WITHSCORES'
      );
      
      const drinks: Array<{ drinkId: string; createdAt: number }> = [];
      for (let i = 0; i < results.length; i += 2) {
        drinks.push({
          drinkId: results[i],
          createdAt: parseInt(results[i + 1]),
        });
      }
      
      return drinks;
    }, 'Get pending drinks');
  }

  /**
   * Get user's vote on a drink
   */
  async getUserVote(drinkId: string, userId: string): Promise<1 | -1 | null> {
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    if (!RedisKeyUtils.isValidUserId(userId)) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const votesKey = RedisKeys.drinkVotes(drinkId);
      const vote = await redis.hget(votesKey, userId);
      
      if (!vote) {
        return null;
      }
      
      const voteValue = parseInt(vote);
      return voteValue === 1 ? 1 : voteValue === -1 ? -1 : null;
    }, 'Get user vote');
  }

  /**
   * Get drink vote summary
   */
  async getDrinkVotes(drinkId: string): Promise<{ upvotes: number; downvotes: number; total: number }> {
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const votesKey = RedisKeys.drinkVotes(drinkId);
      const votes = await redis.hgetall(votesKey);
      
      let upvotes = 0;
      let downvotes = 0;
      
      for (const vote of Object.values(votes)) {
        const voteValue = parseInt(vote);
        if (voteValue === 1) {
          upvotes++;
        } else if (voteValue === -1) {
          downvotes++;
        }
      }
      
      return {
        upvotes,
        downvotes,
        total: upvotes + downvotes,
      };
    }, 'Get drink votes');
  }

  /**
   * Delete a drink (admin operation)
   */
  async deleteDrink(drinkId: string): Promise<boolean> {
    if (!RedisKeyUtils.isValidDrinkId(drinkId)) {
      throw new Error(`Invalid drink ID: ${drinkId}`);
    }

    return this.redisClient.execute(async (redis) => {
      const drinkKey = RedisKeys.drink(drinkId);
      const drinkJsonKey = RedisKeys.drinkJson(drinkId);
      const votesKey = RedisKeys.drinkVotes(drinkId);
      const featuredKey = RedisKeys.drinksFeature;
      const pendingKey = RedisKeys.drinksPending;

      // Start transaction
      const multi = redis.multi();

      // Delete all drink-related keys
      multi.del(drinkKey);
      multi.del(drinkJsonKey);
      multi.del(votesKey);
      
      // Remove from leaderboards
      multi.zrem(featuredKey, drinkId);
      multi.zrem(pendingKey, drinkId);

      const results = await multi.exec();
      
      // Check if at least the main drink key was deleted
      return results && results[0] && results[0][1] === 1;
    }, 'Delete drink');
  }

  /**
   * Generate a unique drink ID from recipe
   */
  private generateDrinkId(drink: Drink): string {
    const timestamp = Date.now();
    const components = [
      drink.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
      drink.glass,
      drink.base,
      drink.mixMode,
    ].join('-');

    // Add timestamp for uniqueness
    const timeComponent = timestamp.toString(36);
    
    return `${components}-${timeComponent}`.substring(0, 100); // Limit length
  }
}

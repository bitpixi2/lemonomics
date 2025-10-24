/**
 * Redis Service for Devvit
 * 
 * Integrates the Redis adapters with Devvit's Redis instance.
 */

import { redis } from '@devvit/web/server';
import type { Drink, PlayerStats } from '@bitpixis-bar/types';
import { 
  DrinkAdapter, 
  PlayerAdapter, 
  RateLimitAdapter,
  createRedisClient,
  type SaveDrinkOptions,
  type GetDrinkResult,
  type VoteDrinkOptions 
} from '@bitpixis-bar/redis';

class DevvitRedisService {
  private static instance: DevvitRedisService;
  private drinkAdapter: DrinkAdapter;
  private playerAdapter: PlayerAdapter;
  private rateLimitAdapter: RateLimitAdapter;

  private constructor() {
    // Create Redis client using Devvit's Redis instance
    // Note: We'll need to adapt this to work with Devvit's Redis API
    const redisClient = createRedisClient();
    
    this.drinkAdapter = new DrinkAdapter(redisClient);
    this.playerAdapter = new PlayerAdapter(redisClient);
    this.rateLimitAdapter = new RateLimitAdapter(redisClient);
  }

  public static getInstance(): DevvitRedisService {
    if (!DevvitRedisService.instance) {
      DevvitRedisService.instance = new DevvitRedisService();
    }
    return DevvitRedisService.instance;
  }

  // Drink operations
  async saveDrink(drink: Drink, options: SaveDrinkOptions): Promise<string> {
    return this.drinkAdapter.saveDrink(drink, options);
  }

  async getDrink(drinkId: string): Promise<GetDrinkResult | null> {
    return this.drinkAdapter.getDrink(drinkId);
  }

  async voteDrink(
    drinkId: string, 
    userId: string, 
    voteDirection: 1 | -1, 
    options?: VoteDrinkOptions
  ) {
    return this.drinkAdapter.voteDrink(drinkId, userId, voteDirection, options);
  }

  async getFeaturedDrinks(limit = 10) {
    return this.drinkAdapter.getFeaturedDrinks(limit);
  }

  async getPendingDrinks(limit = 20, offset = 0) {
    return this.drinkAdapter.getPendingDrinks(limit, offset);
  }

  async getUserVote(drinkId: string, userId: string) {
    return this.drinkAdapter.getUserVote(drinkId, userId);
  }

  async getDrinkVotes(drinkId: string) {
    return this.drinkAdapter.getDrinkVotes(drinkId);
  }

  // Player operations
  async getPlayerStats(uid: string): Promise<PlayerStats | null> {
    return this.playerAdapter.getPlayerStats(uid);
  }

  async initializePlayerStats(uid: string): Promise<PlayerStats> {
    return this.playerAdapter.initializePlayerStats(uid);
  }

  async hasUnlockedCustomComponents(uid: string): Promise<boolean> {
    return this.playerAdapter.hasUnlockedCustomComponents(uid);
  }

  async getDrinkCount(uid: string): Promise<number> {
    return this.playerAdapter.getDrinkCount(uid);
  }

  async getTopPlayers(limit = 10) {
    return this.playerAdapter.getTopPlayers(limit);
  }

  // Rate limiting
  async checkRateLimit(action: string, userId: string) {
    return this.rateLimitAdapter.checkRateLimit(action, userId);
  }

  async isActionAllowed(action: string, userId: string): Promise<boolean> {
    return this.rateLimitAdapter.isActionAllowed(action, userId);
  }
}

// For now, let's create a simplified version that works with Devvit's Redis
class DevvitRedisServiceSimplified {
  // Save drink using Devvit's Redis
  async saveDrink(drink: Drink, options: SaveDrinkOptions): Promise<string> {
    const drinkId = this.generateDrinkId(drink);
    const timestamp = Date.now();

    // Save drink metadata
    await redis.hSet(`drink:${drinkId}`, {
      state: 'PENDING',
      score: '0',
      authorUid: options.authorUid,
      thumbUrl: options.thumbUrl,
      createdAt: timestamp.toString(),
      redditPostId: options.redditPostId || '',
    });

    // Save drink recipe
    await redis.set(`drink:${drinkId}:json`, JSON.stringify(drink));

    // Add to pending list
    await redis.zAdd('drinks:pending', { member: drinkId, score: timestamp });

    // Update player stats
    await redis.hIncrBy(`player:${options.authorUid}:stats`, 'drinksCreated', 1);
    
    // Unlock custom components after first drink
    const drinkCount = await redis.hGet(`player:${options.authorUid}:stats`, 'drinksCreated');
    if (!drinkCount || parseInt(drinkCount) <= 1) {
      await redis.hSet(`player:${options.authorUid}:stats`, 'customComponentsUnlocked', 'true');
    }

    return drinkId;
  }

  // Get drink by ID
  async getDrink(drinkId: string): Promise<{ metadata: any; recipe: Drink } | null> {
    const [metadata, recipeJson] = await Promise.all([
      redis.hGetAll(`drink:${drinkId}`),
      redis.get(`drink:${drinkId}:json`),
    ]);

    if (!metadata || !recipeJson) {
      return null;
    }

    return {
      metadata: {
        state: metadata.state,
        score: parseInt(metadata.score) || 0,
        authorUid: metadata.authorUid,
        thumbUrl: metadata.thumbUrl,
        createdAt: parseInt(metadata.createdAt),
        redditPostId: metadata.redditPostId,
      },
      recipe: JSON.parse(recipeJson),
    };
  }

  // Simple voting (without Lua scripts for now)
  async voteDrink(drinkId: string, userId: string, voteDirection: 1 | -1) {
    // Get current vote
    const currentVote = await redis.hGet(`drink:votes:${drinkId}`, userId);
    const previousVote = currentVote ? parseInt(currentVote) : 0;
    
    // Calculate score change
    const scoreChange = voteDirection - previousVote;
    
    if (scoreChange === 0) {
      const currentScore = await redis.hGet(`drink:${drinkId}`, 'score');
      const currentState = await redis.hGet(`drink:${drinkId}`, 'state');
      return {
        newScore: parseInt(currentScore || '0'),
        newState: currentState || 'PENDING',
        previousVote,
      };
    }

    // Update vote
    await redis.hSet(`drink:votes:${drinkId}`, userId, voteDirection.toString());

    // Update score
    const newScore = await redis.hIncrBy(`drink:${drinkId}`, 'score', scoreChange);

    // Check for state transitions
    let newState = await redis.hGet(`drink:${drinkId}`, 'state') || 'PENDING';
    
    if (newState === 'PENDING') {
      if (newScore >= 25) {
        newState = 'FEATURED';
        await redis.hSet(`drink:${drinkId}`, 'state', newState);
        await redis.zRem('drinks:pending', drinkId);
        await redis.zAdd('drinks:featured', { member: drinkId, score: newScore });
      } else if (newScore <= -5) {
        newState = 'RETIRED';
        await redis.hSet(`drink:${drinkId}`, 'state', newState);
        await redis.zRem('drinks:pending', drinkId);
      } else {
        await redis.zAdd('drinks:pending', { member: drinkId, score: newScore });
      }
    } else if (newState === 'FEATURED') {
      await redis.zAdd('drinks:featured', { member: drinkId, score: newScore });
      if (newScore < 25) {
        newState = 'PENDING';
        await redis.hSet(`drink:${drinkId}`, 'state', newState);
        await redis.zRem('drinks:featured', drinkId);
        await redis.zAdd('drinks:pending', { member: drinkId, score: newScore });
      }
    }

    return {
      newScore,
      newState,
      previousVote,
    };
  }

  // Get featured drinks
  async getFeaturedDrinks(limit = 10) {
    const results = await redis.zRange('drinks:featured', 0, limit - 1, { reverse: true, by: 'rank' });
    return results.map(result => ({
      drinkId: result.member,
      score: result.score,
    }));
  }

  // Get pending drinks
  async getPendingDrinks(limit = 20, offset = 0) {
    const results = await redis.zRange('drinks:pending', offset, offset + limit - 1, { reverse: true, by: 'rank' });
    return results.map(result => ({
      drinkId: result.member,
      createdAt: result.score,
    }));
  }

  // Get user's vote on a drink
  async getUserVote(drinkId: string, userId: string): Promise<1 | -1 | null> {
    const vote = await redis.hGet(`drink:votes:${drinkId}`, userId);
    if (!vote) return null;
    const voteValue = parseInt(vote);
    return voteValue === 1 ? 1 : voteValue === -1 ? -1 : null;
  }

  // Simple rate limiting
  async checkRateLimit(action: string, userId: string): Promise<{ allowed: boolean; currentCount: number }> {
    const key = `rl:${action}:${userId}`;
    const windowSize = action === 'vote' ? 60000 : action === 'submit' ? 300000 : 600000; // ms
    const maxRequests = action === 'vote' ? 10 : action === 'submit' ? 3 : 1;
    
    const currentTime = Date.now();
    const windowStart = currentTime - windowSize;
    
    // Remove expired entries
    await redis.zRemRangeByScore(key, 0, windowStart);
    
    // Count current requests
    const currentCount = await redis.zCard(key);
    
    if (currentCount >= maxRequests) {
      return { allowed: false, currentCount };
    }
    
    // Add current request
    await redis.zAdd(key, { member: `${currentTime}-${Math.random()}`, score: currentTime });
    await redis.expire(key, Math.ceil(windowSize / 1000) + 60);
    
    return { allowed: true, currentCount: currentCount + 1 };
  }

  // Get player stats
  async getPlayerStats(uid: string) {
    const stats = await redis.hGetAll(`player:${uid}:stats`);
    if (!stats || Object.keys(stats).length === 0) {
      return null;
    }

    return {
      uid,
      drinksCreated: parseInt(stats.drinksCreated) || 0,
      customComponentsUnlocked: stats.customComponentsUnlocked === 'true',
      totalScore: parseInt(stats.totalScore) || 0,
      featuredDrinks: JSON.parse(stats.featuredDrinks || '[]'),
    };
  }

  private generateDrinkId(drink: Drink): string {
    const timestamp = Date.now();
    const components = [
      drink.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
      drink.glass,
      drink.base,
      drink.mixMode,
    ].join('-');

    return `${components}-${timestamp.toString(36)}`.substring(0, 100);
  }
}

export const redisService = new DevvitRedisServiceSimplified();

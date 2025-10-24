/**
 * Redis Key Structure
 * 
 * Defines all Redis keys used in Bitpixi's Bar with type safety.
 */

export interface RedisKeyStructure {
  // Drink metadata
  drink: (id: string) => string;
  drinkJson: (id: string) => string;
  
  // Vote tracking
  drinkVotes: (id: string) => string;
  
  // Leaderboards and featured drinks
  drinksFeature: string;
  drinksPending: string;
  
  // Player progression
  playerStats: (uid: string) => string;
  
  // Rate limiting
  rateLimit: (action: string, uid: string) => string;
  
  // Custom components
  customComponent: (id: string) => string;
  customComponentVotes: (id: string) => string;
  customComponentsApproved: string;
}

/**
 * Redis key generators with consistent naming
 */
export const RedisKeys: RedisKeyStructure = {
  // Drink metadata: HSET with state, score, authorUid, thumbUrl, createdAt, redditPostId
  drink: (id: string) => `drink:${id}`,
  
  // Drink recipe JSON: STRING with full drink recipe
  drinkJson: (id: string) => `drink:${id}:json`,
  
  // Vote tracking: HASH with uid -> vote direction (1 or -1)
  drinkVotes: (id: string) => `drink:votes:${id}`,
  
  // Featured drinks leaderboard: ZSET with score as rank
  drinksFeature: 'drinks:featured',
  
  // Pending drinks list: ZSET with timestamp as score
  drinksPending: 'drinks:pending',
  
  // Player statistics: HASH with drinksCreated, customComponentsUnlocked, totalScore, etc.
  playerStats: (uid: string) => `player:${uid}:stats`,
  
  // Rate limiting: ZSET with timestamp as score and value
  rateLimit: (action: string, uid: string) => `rl:${action}:${uid}`,
  
  // Custom component metadata: HSET similar to drink
  customComponent: (id: string) => `component:${id}`,
  
  // Custom component votes: HASH with uid -> vote direction
  customComponentVotes: (id: string) => `component:votes:${id}`,
  
  // Approved custom components: ZSET with approval score
  customComponentsApproved: 'components:approved',
};

/**
 * Redis data type definitions for type safety
 */
export interface DrinkMetadata {
  state: 'PENDING' | 'FEATURED' | 'RETIRED';
  score: number;
  authorUid: string;
  thumbUrl: string;
  createdAt: number;
  redditPostId?: string;
}

export interface PlayerStatsData {
  drinksCreated: number;
  customComponentsUnlocked: boolean;
  totalScore: number;
  featuredDrinks: string; // JSON array of drink IDs
  customComponentsCreated: number;
}

export interface CustomComponentMetadata {
  type: 'glass' | 'backdrop' | 'flavor' | 'topping';
  name: string;
  state: 'PENDING' | 'APPROVED' | 'REJECTED';
  score: number;
  authorUid: string;
  createdAt: number;
  redditPostId?: string;
}

/**
 * Utility functions for key validation and parsing
 */
export class RedisKeyUtils {
  /**
   * Validate drink ID format
   */
  static isValidDrinkId(id: string): boolean {
    return /^[a-zA-Z0-9\-_]+$/.test(id) && id.length > 0 && id.length <= 100;
  }

  /**
   * Validate user ID format
   */
  static isValidUserId(uid: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(uid) && uid.length > 0 && uid.length <= 50;
  }

  /**
   * Extract drink ID from Redis key
   */
  static extractDrinkId(key: string): string | null {
    const match = key.match(/^drink:([^:]+)(?::.*)?$/);
    return match ? match[1] : null;
  }

  /**
   * Extract user ID from Redis key
   */
  static extractUserId(key: string): string | null {
    const match = key.match(/^player:([^:]+):stats$/);
    return match ? match[1] : null;
  }

  /**
   * Generate time-based score for ZSET operations
   */
  static generateTimeScore(timestamp?: number): number {
    return timestamp || Date.now();
  }

  /**
   * Generate rate limit window key
   */
  static getRateLimitWindow(action: string, uid: string, windowStart: number): string {
    return `${RedisKeys.rateLimit(action, uid)}:${Math.floor(windowStart / 60000)}`;
  }
}

export default RedisKeys;

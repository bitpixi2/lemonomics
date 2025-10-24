import type { RedditUserData } from '../../shared/types/game.js';

interface CachedUserStats {
  data: RedditUserData;
  cachedAt: number;
  ttl: number;
}

/**
 * Service for fetching and caching Reddit user statistics
 * Implements caching with TTL to reduce API calls and improve performance
 */
export class RedditStatsService {
  private cache = new Map<string, CachedUserStats>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Retrieve Reddit user statistics with caching
   * @param userId - Reddit user ID
   * @param context - Devvit context for Reddit API access
   * @returns Promise<RedditUserData>
   */
  async getUserStats(userId: string, context: any): Promise<RedditUserData> {
    // Check cache first
    const cached = this.getCachedStats(userId);
    if (cached) {
      return cached;
    }

    try {
      // Fetch fresh data from Reddit API
      const userData = await this.fetchUserDataFromReddit(userId, context);
      
      // Cache the result
      this.cacheUserStats(userId, userData);
      
      return userData;
    } catch (error) {
      console.error(`Failed to fetch Reddit stats for user ${userId}:`, error);
      
      // If we have expired cached data, return it as fallback
      const expiredCache = this.cache.get(userId);
      if (expiredCache) {
        console.warn(`Using expired cache for user ${userId} due to API failure`);
        return expiredCache.data;
      }
      
      // If no cache available, return default values
      return this.getDefaultUserData(userId);
    }
  }

  /**
   * Fetch user data directly from Reddit API
   * @param userId - Reddit user ID
   * @param context - Devvit context for Reddit API access
   * @returns Promise<RedditUserData>
   */
  private async fetchUserDataFromReddit(userId: string, context: any): Promise<RedditUserData> {
    try {
      // Get user information from Reddit API
      const user = await context.reddit.getUserById(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Calculate account age in days
      const accountCreated = new Date(user.createdAt);
      const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

      // Get karma information
      const postKarma = user.linkKarma || 0;
      const commentKarma = user.commentKarma || 0;
      
      // Get awards count (if available)
      // Note: Awards API might be limited, using 0 as default
      const totalAwards = 0; // This would need to be implemented based on available Reddit API

      return {
        username: user.username,
        postKarma,
        commentKarma,
        accountCreated,
        totalAwards,
      };
    } catch (error) {
      console.error('Reddit API error:', error);
      throw new Error(`Failed to fetch user data from Reddit: ${error.message}`);
    }
  }

  /**
   * Get cached user stats if available and not expired
   * @param userId - Reddit user ID
   * @returns RedditUserData | null
   */
  private getCachedStats(userId: string): RedditUserData | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - cached.cachedAt) > cached.ttl;
    
    if (isExpired) {
      // Don't delete expired cache yet - might be useful as fallback
      return null;
    }

    return cached.data;
  }

  /**
   * Cache user stats with TTL
   * @param userId - Reddit user ID
   * @param data - User data to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  private cacheUserStats(userId: string, data: RedditUserData, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(userId, {
      data,
      cachedAt: Date.now(),
      ttl,
    });
  }

  /**
   * Get default user data for error cases
   * @param userId - Reddit user ID
   * @returns RedditUserData with default values
   */
  private getDefaultUserData(userId: string): RedditUserData {
    return {
      username: `user_${userId.slice(-8)}`, // Use last 8 chars of userId as fallback username
      postKarma: 0,
      commentKarma: 0,
      accountCreated: new Date(),
      totalAwards: 0,
    };
  }

  /**
   * Clear expired cache entries
   * Should be called periodically to prevent memory leaks
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [userId, cached] of this.cache.entries()) {
      const isExpired = (now - cached.cachedAt) > cached.ttl;
      if (isExpired) {
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Force refresh user stats (bypass cache)
   * @param userId - Reddit user ID
   * @param context - Devvit context for Reddit API access
   * @returns Promise<RedditUserData>
   */
  async refreshUserStats(userId: string, context: any): Promise<RedditUserData> {
    try {
      const userData = await this.fetchUserDataFromReddit(userId, context);
      this.cacheUserStats(userId, userData);
      return userData;
    } catch (error) {
      console.error(`Failed to refresh Reddit stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics for monitoring
   * @returns Object with cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const redditStatsService = new RedditStatsService();

/**
 * Lua Script Loader
 * 
 * Loads and manages Lua scripts for Redis atomic operations.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type Redis from 'ioredis';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface LuaScripts {
  voteDrink: string;
  rateLimit: string;
  syncRedditVotes: string;
}

export interface VoteDrinkResult {
  newScore: number;
  newState: string;
  previousVote: number;
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetTime: number;
}

export interface SyncVotesResult {
  newScore: number;
  newState: string;
  updatedVotes: number;
}

class LuaScriptManager {
  private scripts: LuaScripts;
  private scriptShas: Map<string, string> = new Map();

  constructor() {
    this.scripts = this.loadScripts();
  }

  /**
   * Load all Lua scripts from files
   */
  private loadScripts(): LuaScripts {
    try {
      return {
        voteDrink: readFileSync(join(__dirname, 'vote-drink.lua'), 'utf8'),
        rateLimit: readFileSync(join(__dirname, 'rate-limit.lua'), 'utf8'),
        syncRedditVotes: readFileSync(join(__dirname, 'sync-reddit-votes.lua'), 'utf8'),
      };
    } catch (error) {
      console.error('Failed to load Lua scripts:', error);
      throw error;
    }
  }

  /**
   * Load scripts into Redis and cache their SHAs
   */
  async loadIntoRedis(redis: Redis): Promise<void> {
    try {
      for (const [name, script] of Object.entries(this.scripts)) {
        const sha = await redis.script('LOAD', script);
        this.scriptShas.set(name, sha);
        console.log(`✅ Loaded Lua script: ${name} (${sha.substring(0, 8)}...)`);
      }
    } catch (error) {
      console.error('Failed to load scripts into Redis:', error);
      throw error;
    }
  }

  /**
   * Execute vote drink script
   */
  async executeVoteDrink(
    redis: Redis,
    drinkId: string,
    userId: string,
    voteDirection: 1 | -1,
    authorUid: string,
    options: {
      featuredThreshold?: number;
      retiredThreshold?: number;
    } = {}
  ): Promise<VoteDrinkResult> {
    const keys = [
      `drink:${drinkId}`,
      `drink:votes:${drinkId}`,
      'drinks:featured',
      'drinks:pending',
      `player:${authorUid}:stats`,
    ];

    const args = [
      userId,
      voteDirection.toString(),
      Date.now().toString(),
      (options.featuredThreshold || 25).toString(),
      (options.retiredThreshold || -5).toString(),
    ];

    try {
      const sha = this.scriptShas.get('voteDrink');
      if (!sha) {
        throw new Error('Vote drink script not loaded');
      }

      const result = await redis.evalsha(sha, keys.length, ...keys, ...args) as [number, string, number];
      
      return {
        newScore: result[0],
        newState: result[1],
        previousVote: result[2],
      };
    } catch (error) {
      // Fallback to EVAL if EVALSHA fails (script not in cache)
      if (error instanceof Error && error.message.includes('NOSCRIPT')) {
        const result = await redis.eval(
          this.scripts.voteDrink,
          keys.length,
          ...keys,
          ...args
        ) as [number, string, number];
        
        return {
          newScore: result[0],
          newState: result[1],
          previousVote: result[2],
        };
      }
      throw error;
    }
  }

  /**
   * Execute rate limit script
   */
  async executeRateLimit(
    redis: Redis,
    action: string,
    userId: string,
    options: {
      windowSize?: number; // milliseconds
      maxRequests?: number;
    } = {}
  ): Promise<RateLimitResult> {
    const keys = [`rl:${action}:${userId}`];
    const currentTime = Date.now();
    const requestId = `${currentTime}-${Math.random().toString(36).substring(2)}`;
    
    const args = [
      currentTime.toString(),
      (options.windowSize || 60000).toString(), // 1 minute default
      (options.maxRequests || 10).toString(),
      requestId,
    ];

    try {
      const sha = this.scriptShas.get('rateLimit');
      if (!sha) {
        throw new Error('Rate limit script not loaded');
      }

      const result = await redis.evalsha(sha, keys.length, ...keys, ...args) as [number, number, number];
      
      return {
        allowed: result[0] === 1,
        currentCount: result[1],
        resetTime: result[2],
      };
    } catch (error) {
      // Fallback to EVAL if EVALSHA fails
      if (error instanceof Error && error.message.includes('NOSCRIPT')) {
        const result = await redis.eval(
          this.scripts.rateLimit,
          keys.length,
          ...keys,
          ...args
        ) as [number, number, number];
        
        return {
          allowed: result[0] === 1,
          currentCount: result[1],
          resetTime: result[2],
        };
      }
      throw error;
    }
  }

  /**
   * Execute sync Reddit votes script
   */
  async executeSyncRedditVotes(
    redis: Redis,
    drinkId: string,
    voteUpdates: Array<{ userId: string; vote: 1 | -1 | 0 }>,
    options: {
      featuredThreshold?: number;
      retiredThreshold?: number;
    } = {}
  ): Promise<SyncVotesResult> {
    const keys = [
      `drink:${drinkId}`,
      `drink:votes:${drinkId}`,
      'drinks:featured',
      'drinks:pending',
    ];

    const args = [
      JSON.stringify(voteUpdates),
      Date.now().toString(),
      (options.featuredThreshold || 25).toString(),
      (options.retiredThreshold || -5).toString(),
    ];

    try {
      const sha = this.scriptShas.get('syncRedditVotes');
      if (!sha) {
        throw new Error('Sync Reddit votes script not loaded');
      }

      const result = await redis.evalsha(sha, keys.length, ...keys, ...args) as [number, string, number];
      
      return {
        newScore: result[0],
        newState: result[1],
        updatedVotes: result[2],
      };
    } catch (error) {
      // Fallback to EVAL if EVALSHA fails
      if (error instanceof Error && error.message.includes('NOSCRIPT')) {
        const result = await redis.eval(
          this.scripts.syncRedditVotes,
          keys.length,
          ...keys,
          ...args
        ) as [number, string, number];
        
        return {
          newScore: result[0],
          newState: result[1],
          updatedVotes: result[2],
        };
      }
      throw error;
    }
  }

  /**
   * Get loaded script SHA
   */
  getScriptSha(scriptName: keyof LuaScripts): string | undefined {
    return this.scriptShas.get(scriptName);
  }

  /**
   * Check if all scripts are loaded
   */
  areScriptsLoaded(): boolean {
    return this.scriptShas.size === Object.keys(this.scripts).length;
  }
}

// Singleton instance
let scriptManager: LuaScriptManager | null = null;

/**
 * Get Lua script manager instance
 */
export function getLuaScriptManager(): LuaScriptManager {
  if (!scriptManager) {
    scriptManager = new LuaScriptManager();
  }
  return scriptManager;
}

export { LuaScriptManager };

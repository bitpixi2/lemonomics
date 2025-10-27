// Simplified Leaderboard Redis storage adapter for Lemonomics
import type { LeaderboardEntry } from '../types/game.js';
import type { LemonomicsRedisClient } from './client.js';
import { DEFAULT_CONFIG } from '../types/config.js';

export class LeaderboardAdapter {
  private redis: LemonomicsRedisClient;
  private readonly MAX_ENTRIES = 10; // Top 10 players only

  constructor(redis: LemonomicsRedisClient) {
    this.redis = redis;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardData = await this.redis.getLeaderboard();
      if (!leaderboardData) {
        return [];
      }
      return JSON.parse(leaderboardData) as LeaderboardEntry[];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async addScore(username: string, finalCash: number, daysPlayed: number): Promise<number> {
    try {
      const leaderboard = await this.getLeaderboard();
      
      // Remove existing entry for this user if it exists
      const existingIndex = leaderboard.findIndex(entry => entry.username === username);
      if (existingIndex !== -1) {
        // Only update if new score is better
        const existingEntry = leaderboard[existingIndex];
        if (existingEntry && finalCash <= existingEntry.finalCash) {
          return existingEntry.rank; // Return existing rank if score is not better
        }
        leaderboard.splice(existingIndex, 1);
      }

      // Add new entry
      const newEntry: LeaderboardEntry = {
        rank: 0, // Will be calculated after sorting
        username,
        finalCash,
        daysPlayed,
        timestamp: new Date(),
        isCurrentPlayer: false
      };

      leaderboard.push(newEntry);

      // Sort by final cash (descending) and limit to MAX_ENTRIES
      leaderboard.sort((a, b) => b.finalCash - a.finalCash);
      const trimmedLeaderboard = leaderboard.slice(0, this.MAX_ENTRIES);

      // Update ranks
      trimmedLeaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Save back to Redis
      await this.redis.setLeaderboard(
        JSON.stringify(trimmedLeaderboard), 
        DEFAULT_CONFIG.redis.ttl.leaderboard
      );

      // Find and return the player's rank
      const playerEntry = trimmedLeaderboard.find(entry => entry.username === username);
      return playerEntry ? playerEntry.rank : trimmedLeaderboard.length + 1;
    } catch (error) {
      console.error('Error adding score to leaderboard:', error);
      return -1;
    }
  }

  async getLeaderboardWithPlayerHighlight(currentUsername: string): Promise<LeaderboardEntry[]> {
    try {
      const leaderboard = await this.getLeaderboard();
      
      // Mark the current player's entry
      return leaderboard.map(entry => ({
        ...entry,
        isCurrentPlayer: entry.username === currentUsername
      }));
    } catch (error) {
      console.error('Error getting leaderboard with player highlight:', error);
      return [];
    }
  }

  async getUserRank(username: string): Promise<number | null> {
    try {
      const leaderboard = await this.getLeaderboard();
      const entry = leaderboard.find(entry => entry.username === username);
      return entry ? entry.rank : null;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  async getTopPlayers(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const leaderboard = await this.getLeaderboard();
      return leaderboard.slice(0, Math.min(limit, leaderboard.length));
    } catch (error) {
      console.error('Error getting top players:', error);
      return [];
    }
  }

  async clearLeaderboard(): Promise<boolean> {
    try {
      await this.redis.setLeaderboard('[]');
      return true;
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
      return false;
    }
  }

  async getLeaderboardStats(): Promise<{
    totalPlayers: number;
    topScore: number;
    averageScore: number;
  }> {
    try {
      const leaderboard = await this.getLeaderboard();
      
      if (leaderboard.length === 0) {
        return { totalPlayers: 0, topScore: 0, averageScore: 0 };
      }

      const scores = leaderboard.map(entry => entry.finalCash);
      const topScore = Math.max(...scores);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      return {
        totalPlayers: leaderboard.length,
        topScore,
        averageScore: Math.round(averageScore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return { totalPlayers: 0, topScore: 0, averageScore: 0 };
    }
  }
}

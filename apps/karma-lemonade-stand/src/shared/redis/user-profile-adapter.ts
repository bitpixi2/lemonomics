// Simplified UserProfile Redis storage adapter for Lemonomics
import type { UserProfile, StreakData, KarmaBoost } from '../types/game.js';
import type { LemonomicsRedisClient } from './client.js';
import { DEFAULT_CONFIG } from '../types/config.js';

export class UserProfileAdapter {
  private redis: LemonomicsRedisClient;

  constructor(redis: LemonomicsRedisClient) {
    this.redis = redis;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileData = await this.redis.getUserProfile(userId);
      if (!profileData) {
        return null;
      }
      return JSON.parse(profileData) as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async setProfile(userId: string, profile: UserProfile): Promise<boolean> {
    try {
      const profileData = JSON.stringify(profile);
      await this.redis.setUserProfile(userId, profileData, DEFAULT_CONFIG.redis.ttl.userProfile);
      return true;
    } catch (error) {
      console.error('Error setting user profile:', error);
      return false;
    }
  }

  async createProfile(userId: string, username: string, redditKarma: number): Promise<UserProfile | null> {
    try {
      const karmaBoost = this.calculateKarmaBoost(redditKarma);
      
      const newProfile: UserProfile = {
        userId,
        username,
        redditKarma,
        karmaBoost,
        stats: {
          gamesPlayed: 0,
          bestCash: 0,
          totalDaysPlayed: 0,
          lastPlayDate: new Date().toISOString().split('T')[0] as string
        },
        streakData: {
          currentStreak: 0,
          lastPlayDate: '',
          longestStreak: 0,
          bonusesEarned: []
        }
      };

      const success = await this.setProfile(userId, newProfile);
      return success ? newProfile : null;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const existingProfile = await this.getProfile(userId);
      if (!existingProfile) {
        return false;
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        // Deep merge nested objects
        stats: {
          ...existingProfile.stats,
          ...(updates.stats || {})
        },
        streakData: {
          ...existingProfile.streakData,
          ...(updates.streakData || {})
        }
      };

      return await this.setProfile(userId, updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  async updateGameStats(userId: string, finalCash: number, daysPlayed: number): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      const updatedStats = {
        ...profile.stats,
        gamesPlayed: profile.stats.gamesPlayed + 1,
        bestCash: Math.max(profile.stats.bestCash, finalCash),
        totalDaysPlayed: profile.stats.totalDaysPlayed + daysPlayed,
        lastPlayDate: new Date().toISOString().split('T')[0] as string
      };

      return await this.updateProfile(userId, { stats: updatedStats });
    } catch (error) {
      console.error('Error updating game stats:', error);
      return false;
    }
  }

  async updateStreak(userId: string, streakData: StreakData): Promise<boolean> {
    try {
      return await this.updateProfile(userId, { streakData });
    } catch (error) {
      console.error('Error updating streak:', error);
      return false;
    }
  }

  async updateKarma(userId: string, newKarma: number): Promise<boolean> {
    try {
      const karmaBoost = this.calculateKarmaBoost(newKarma);
      return await this.updateProfile(userId, { 
        redditKarma: newKarma,
        karmaBoost 
      });
    } catch (error) {
      console.error('Error updating karma:', error);
      return false;
    }
  }

  private calculateKarmaBoost(karma: number): KarmaBoost {
    const config = DEFAULT_CONFIG.karma;
    
    if (karma >= config.thresholds.gold) {
      return {
        multiplier: config.multipliers.gold,
        level: 'gold',
        description: 'Gold Karma Boost: 2.0x demand!',
        threshold: config.thresholds.gold
      };
    } else if (karma >= config.thresholds.silver) {
      return {
        multiplier: config.multipliers.silver,
        level: 'silver',
        description: 'Silver Karma Boost: 1.5x demand!',
        threshold: config.thresholds.silver
      };
    } else if (karma >= config.thresholds.bronze) {
      return {
        multiplier: config.multipliers.bronze,
        level: 'bronze',
        description: 'Bronze Karma Boost: 1.2x demand!',
        threshold: config.thresholds.bronze
      };
    } else {
      return {
        multiplier: 1.0,
        level: 'none',
        description: 'No karma boost yet. Get more karma!',
        threshold: 0
      };
    }
  }

  async profileExists(userId: string): Promise<boolean> {
    try {
      return await this.redis.exists(`user:${userId}`);
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    try {
      await this.redis.delete(`user:${userId}`);
      await this.redis.delete(`streak:${userId}`);
      await this.redis.delete(`login_bonus:${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }
}

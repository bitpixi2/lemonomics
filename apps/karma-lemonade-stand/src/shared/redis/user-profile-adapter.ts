// UserProfile Redis storage adapter
import type { UserProfile } from '../types/game.js';
import type { GameRedisClient } from './client.js';

export class UserProfileAdapter {
  private redis: GameRedisClient;

  constructor(redis: GameRedisClient) {
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
      await this.redis.setUserProfile(userId, profileData);
      return true;
    } catch (error) {
      console.error('Error setting user profile:', error);
      return false;
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
        redditStats: {
          ...existingProfile.redditStats,
          ...(updates.redditStats || {})
        },
        gameStats: {
          ...existingProfile.gameStats,
          ...(updates.gameStats || {})
        },
        progress: {
          ...existingProfile.progress,
          ...(updates.progress || {})
        },
        powerups: {
          ...existingProfile.powerups,
          ...(updates.powerups || {})
        }
      };

      return await this.setProfile(userId, updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  async createProfile(userId: string, username: string, redditStats: UserProfile['redditStats']): Promise<UserProfile | null> {
    try {
      const newProfile: UserProfile = {
        userId,
        username,
        redditStats: {
          ...redditStats,
          lastUpdated: new Date()
        },
        gameStats: {
          service: Math.floor(redditStats.commentKarma * 0.001),
          marketing: Math.floor(redditStats.postKarma * 0.001),
          reputation: Math.floor(redditStats.accountAgeDays * 0.01)
        },
        progress: {
          totalRuns: 0,
          currentStreak: 0,
          bestProfit: 0,
          lastPlayDate: new Date().toISOString().substring(0, 10)
        },
        powerups: {
          usedToday: {},
          lastResetDate: new Date().toISOString().substring(0, 10)
        }
      };

      const success = await this.setProfile(userId, newProfile);
      return success ? newProfile : null;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  async updateGameStats(userId: string, redditStats: UserProfile['redditStats']): Promise<boolean> {
    try {
      const gameStats = {
        service: Math.floor(redditStats.commentKarma * 0.001),
        marketing: Math.floor(redditStats.postKarma * 0.001),
        reputation: Math.floor(redditStats.accountAgeDays * 0.01)
      };

      return await this.updateProfile(userId, {
        redditStats: {
          ...redditStats,
          lastUpdated: new Date()
        },
        gameStats
      });
    } catch (error) {
      console.error('Error updating game stats:', error);
      return false;
    }
  }

  async updateProgress(userId: string, progressUpdates: Partial<UserProfile['progress']>): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      const updatedProgress = {
        ...profile.progress,
        ...progressUpdates
      };

      return await this.updateProfile(userId, {
        progress: updatedProgress
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  }

  async incrementTotalRuns(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      const today = new Date().toISOString().substring(0, 10);
      const updatedProgress = {
        ...profile.progress,
        totalRuns: (profile.progress.totalRuns || 0) + 1,
        lastPlayDate: today
      };
      return await this.updateProfile(userId, { progress: updatedProgress });
    } catch (error) {
      console.error('Error incrementing total runs:', error);
      return false;
    }
  }

  async updateBestProfit(userId: string, profit: number): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      if (profit > (profile.progress.bestProfit || 0)) {
        const updatedProgress = {
          ...profile.progress,
          bestProfit: profit
        };
        return await this.updateProfile(userId, { progress: updatedProgress });
      }

      return true;
    } catch (error) {
      console.error('Error updating best profit:', error);
      return false;
    }
  }

  async updateStreak(userId: string, streak: number): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      const updatedProgress = {
        ...profile.progress,
        currentStreak: streak
      };
      return await this.updateProfile(userId, { progress: updatedProgress });
    } catch (error) {
      console.error('Error updating streak:', error);
      return false;
    }
  }

  async getPowerupUsage(userId: string): Promise<Record<string, number>> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return {};
      }

      // Reset daily usage if it's a new day
      const today = new Date().toISOString().substring(0, 10);
      if (profile.powerups.lastResetDate !== today) {
        await this.updateProfile(userId, {
          powerups: {
            usedToday: {},
            lastResetDate: today
          }
        });
        return {};
      }

      return profile.powerups.usedToday;
    } catch (error) {
      console.error('Error getting powerup usage:', error);
      return {};
    }
  }

  async incrementPowerupUsage(userId: string, powerupType: string): Promise<boolean> {
    try {
      const currentUsage = await this.getPowerupUsage(userId);
      const newUsage = {
        ...currentUsage,
        [powerupType]: (currentUsage[powerupType] || 0) + 1
      };

      const today = new Date().toISOString().substring(0, 10);
      const profile = await this.getProfile(userId);
      if (!profile) {
        return false;
      }

      return await this.updateProfile(userId, {
        powerups: {
          usedToday: newUsage,
          lastResetDate: today
        }
      });
    } catch (error) {
      console.error('Error incrementing powerup usage:', error);
      return false;
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
      await this.redis.delete(`user:${userId}:powerups`);
      await this.redis.delete(`user:${userId}:streak`);
      await this.redis.delete(`user:${userId}:history`);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  async resetAllDailyPowerups(): Promise<boolean> {
    try {
      // This is a placeholder implementation
      // In a real Redis setup, you'd use a Lua script or scan pattern
      console.log('Resetting daily powerups for all users...');
      
      // For now, we'll implement this as a batch operation
      // In production, you'd want to use Redis SCAN to iterate through all user keys
      // and reset their daily powerup counters
      
      return true;
    } catch (error) {
      console.error('Error resetting all daily powerups:', error);
      return false;
    }
  }

  async resetAllWeeklyPowerups(): Promise<boolean> {
    try {
      // This is a placeholder implementation
      // Similar to daily reset but for weekly limits
      console.log('Resetting weekly powerups for all users...');
      
      return true;
    } catch (error) {
      console.error('Error resetting all weekly powerups:', error);
      return false;
    }
  }


}

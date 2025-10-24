import { Request, Response } from 'express';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';
import { RedditStatsService } from '../services/reddit-stats-service.js';
import { StatConverter } from '../services/stat-converter.js';
import { ProgressService } from '../progress/progress-service.js';
import { UserProfile } from '../../shared/types/game.js';

export interface ProfileResponse {
  success: boolean;
  profile?: UserProfile;
  progressSummary?: any;
  error?: string;
}

export class ProfileEndpoint {
  private userAdapter: UserProfileAdapter;
  private redditStatsService: RedditStatsService;
  private statConverter: StatConverter;
  private progressService: ProgressService;

  constructor() {
    this.userAdapter = new UserProfileAdapter();
    this.redditStatsService = new RedditStatsService();
    this.statConverter = new StatConverter();
    this.progressService = new ProgressService();
  }

  async handleGetProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const username = req.headers['x-username'] as string;

      if (!userId || !username) {
        res.status(400).json({
          success: false,
          error: 'Missing user identification'
        });
        return;
      }

      // Try to get existing profile
      let userProfile = await this.userAdapter.getProfile(userId);

      if (!userProfile) {
        // Create new profile for first-time user
        userProfile = await this.createNewProfile(userId, username);
      } else {
        // Update Reddit stats if they're stale (older than 1 hour)
        const lastUpdated = new Date(userProfile.redditStats.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastUpdated < oneHourAgo) {
          userProfile = await this.refreshRedditStats(userProfile);
        }
      }

      // Get progress summary
      const progressSummary = this.progressService.getProgressSummary(userProfile);

      res.json({
        success: true,
        profile: userProfile,
        progressSummary
      });

    } catch (error) {
      console.error('Profile endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load user profile'
      });
    }
  }

  async handleUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const updates = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing user ID'
        });
        return;
      }

      const existingProfile = await this.userAdapter.getProfile(userId);
      if (!existingProfile) {
        res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
        return;
      }

      // Only allow updating certain fields
      const allowedUpdates = ['progress', 'powerups'];
      const filteredUpdates: Partial<UserProfile> = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key as keyof UserProfile] = updates[key];
        }
      }

      const updatedProfile = {
        ...existingProfile,
        ...filteredUpdates
      };

      await this.userAdapter.updateProfile(updatedProfile);

      res.json({
        success: true,
        profile: updatedProfile
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  }

  private async createNewProfile(userId: string, username: string): Promise<UserProfile> {
    // Fetch Reddit stats
    const redditStats = await this.redditStatsService.getUserStats(username);
    
    // Convert to game stats
    const gameStats = this.statConverter.convertRedditStats(redditStats);

    // Create new profile
    const newProfile: UserProfile = {
      userId,
      username,
      redditStats: {
        postKarma: redditStats.postKarma,
        commentKarma: redditStats.commentKarma,
        accountAgeDays: redditStats.accountAgeDays,
        awards: redditStats.awards,
        lastUpdated: new Date()
      },
      gameStats,
      progress: {
        totalRuns: 0,
        currentStreak: 0,
        longestStreak: 0,
        bestProfit: 0,
        totalProfit: 0
      },
      powerups: {
        usedToday: {},
        lastResetDate: new Date().toISOString().split('T')[0]
      }
    };

    // Save new profile
    await this.userAdapter.createProfile(newProfile);

    return newProfile;
  }

  private async refreshRedditStats(profile: UserProfile): Promise<UserProfile> {
    try {
      // Fetch fresh Reddit stats
      const redditStats = await this.redditStatsService.getUserStats(profile.username);
      
      // Convert to game stats
      const gameStats = this.statConverter.convertRedditStats(redditStats);

      // Update profile
      const updatedProfile: UserProfile = {
        ...profile,
        redditStats: {
          postKarma: redditStats.postKarma,
          commentKarma: redditStats.commentKarma,
          accountAgeDays: redditStats.accountAgeDays,
          awards: redditStats.awards,
          lastUpdated: new Date()
        },
        gameStats
      };

      // Save updated profile
      await this.userAdapter.updateProfile(updatedProfile);

      return updatedProfile;

    } catch (error) {
      console.error('Failed to refresh Reddit stats:', error);
      // Return existing profile if refresh fails
      return profile;
    }
  }
}

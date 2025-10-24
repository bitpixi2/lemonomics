import { Request, Response } from 'express';
import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter.js';
import { PureLeagueService } from '../payments/pure-league-service.js';
import { Leaderboard } from '../../shared/types/game.js';

export interface LeaderboardResponse {
  success: boolean;
  daily?: Leaderboard;
  weekly?: Leaderboard;
  userRanks?: {
    daily: number;
    weekly: number;
    dailyPure: number;
    weeklyPure: number;
  };
  error?: string;
}

export class LeaderboardEndpoint {
  private leaderboardAdapter: LeaderboardAdapter;
  private pureLeagueService: PureLeagueService;

  constructor() {
    this.leaderboardAdapter = new LeaderboardAdapter();
    this.pureLeagueService = new PureLeagueService();
  }

  async handleGetLeaderboards(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { type, limit = 50 } = req.query;

      // Validate limit
      const maxLimit = Math.min(parseInt(limit as string) || 50, 100);

      let dailyLeaderboard: Leaderboard | undefined;
      let weeklyLeaderboard: Leaderboard | undefined;

      // Get requested leaderboards
      if (!type || type === 'daily') {
        dailyLeaderboard = await this.getDailyLeaderboard(maxLimit);
      }

      if (!type || type === 'weekly') {
        weeklyLeaderboard = await this.getWeeklyLeaderboard(maxLimit);
      }

      // Get user rankings if userId provided
      let userRanks;
      if (userId) {
        userRanks = await this.getUserRanks(userId);
      }

      res.json({
        success: true,
        daily: dailyLeaderboard,
        weekly: weeklyLeaderboard,
        userRanks
      });

    } catch (error) {
      console.error('Leaderboard endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load leaderboards'
      });
    }
  }

  async handleGetUserRank(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { type = 'daily' } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing user ID'
        });
        return;
      }

      let rank: number;
      let pureRank: number;

      if (type === 'daily') {
        rank = await this.leaderboardAdapter.getUserRankSimple(userId, 'daily');
        pureRank = await this.pureLeagueService.getUserRank(userId, 'daily');
      } else {
        rank = await this.leaderboardAdapter.getUserRankSimple(userId, 'weekly');
        pureRank = await this.pureLeagueService.getUserRank(userId, 'weekly');
      }

      res.json({
        success: true,
        rank,
        pureRank,
        type
      });

    } catch (error) {
      console.error('User rank endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user rank'
      });
    }
  }

  private async getDailyLeaderboard(limit: number): Promise<Leaderboard> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get regular leaderboard
    const entries = await this.leaderboardAdapter.getTopScores('daily', limit);
    
    // Get pure league leaderboard
    const pureEntries = await this.pureLeagueService.getTopScores('daily', limit);

    return {
      type: 'daily',
      date: today,
      entries,
      pure: pureEntries
    };
  }

  private async getWeeklyLeaderboard(limit: number): Promise<Leaderboard> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    // Get regular leaderboard
    const entries = await this.leaderboardAdapter.getTopScores('weekly', limit);
    
    // Get pure league leaderboard
    const pureEntries = await this.pureLeagueService.getTopScores('weekly', limit);

    return {
      type: 'weekly',
      date: weekKey,
      entries,
      pure: pureEntries
    };
  }

  private async getUserRanks(userId: string) {
    const [daily, weekly, dailyPure, weeklyPure] = await Promise.all([
      this.leaderboardAdapter.getUserRankSimple(userId, 'daily'),
      this.leaderboardAdapter.getUserRankSimple(userId, 'weekly'),
      this.pureLeagueService.getUserRank(userId, 'daily'),
      this.pureLeagueService.getUserRank(userId, 'weekly')
    ]);

    return {
      daily,
      weekly,
      dailyPure,
      weeklyPure
    };
  }
}

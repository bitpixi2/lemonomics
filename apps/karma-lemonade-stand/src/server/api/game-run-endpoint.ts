import { Request, Response } from 'express';
import { GameEngine } from '../engine/game-engine.js';
import { ProgressService } from '../progress/progress-service.js';
// import { SecurityService } from '../security/security-service.js'; // Disabled for simplicity
import { PowerupManager } from '../payments-disabled/payments/powerup-manager.js';
import { BonusService } from '../services/bonus-service.js';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';
import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter.js';
import { GameRun, GameResult, UserProfile } from '../../shared/types/game.js';
import { marketNewsGenerator } from '../ai/market-news-generator.js';
import { customerDialogueGenerator } from '../ai/customer-dialogue-generator.js';

export interface GameRunRequest {
  price: number;
  adSpend: number;
  powerupReceipts?: string[];
}

export interface GameRunResponse {
  success: boolean;
  result?: GameResult;
  progress?: any;
  updatedProfile?: UserProfile;
  aiContent?: {
    marketNews?: any;
    customerDialogue?: any;
  };
  error?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

export class GameRunEndpoint {
  private gameEngine: GameEngine;
  private progressService: ProgressService;
  private securityService: SecurityService;
  private powerupManager: PowerupManager;
  private bonusService: BonusService;
  private userAdapter: UserProfileAdapter;
  private leaderboardAdapter: LeaderboardAdapter;

  constructor() {
    // These would be properly initialized with dependencies in a real implementation
    // For now, we'll create placeholder instances
    this.gameEngine = {} as GameEngine;
    this.progressService = ProgressService;
    this.securityService = {} as SecurityService;
    this.powerupManager = {} as PowerupManager;
    this.bonusService = {} as BonusService;
    this.userAdapter = {} as UserProfileAdapter;
    this.leaderboardAdapter = {} as LeaderboardAdapter;
  }

  async handleGameRun(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { price, adSpend, powerupReceipts = [] } = req.body as GameRunRequest;

      // Input validation
      const validationResult = this.validateInput(price, adSpend);
      if (!validationResult.valid) {
        res.status(400).json({
          success: false,
          error: validationResult.error
        });
        return;
      }

      // Rate limiting check
      const rateLimitResult = await this.securityService.checkRateLimit(userId);
      if (!rateLimitResult.allowed) {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please wait before running another game.',
          rateLimitInfo: {
            remaining: 0,
            resetTime: rateLimitResult.resetTime
          }
        });
        return;
      }

      // Load user profile
      const userProfile = await this.userAdapter.getProfile(userId);
      if (!userProfile) {
        res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
        return;
      }

      // Process power-ups if any
      let processedReceipts: any[] = [];
      if (powerupReceipts.length > 0) {
        const powerupResult = await this.powerupManager.processPowerups(userId, powerupReceipts);
        if (!powerupResult.success) {
          res.status(400).json({
            success: false,
            error: powerupResult.error
          });
          return;
        }
        processedReceipts = powerupResult.receipts || [];
      }

      // Note: Bonus effects are applied automatically in the game engine
      // The BonusEffectsHandler is integrated into the GameEngine

      // Create game run object
      const gameRun: GameRun = {
        userId,
        price,
        adSpend,
        powerupReceipts: processedReceipts
      };

      // Run the game engine
      const gameResult = await this.gameEngine.runGame(gameRun, userProfile);

      // Update progress tracking
      const progressUpdate = this.progressService.updateProgress(userProfile, gameResult);

      // Update user profile with new progress
      const updatedProfile: UserProfile = {
        ...userProfile,
        progress: {
          totalRuns: progressUpdate.personalBest.totalRuns,
          currentStreak: progressUpdate.streak.currentStreak,
          longestStreak: progressUpdate.streak.longestStreak,
          bestProfit: progressUpdate.personalBest.bestProfit,
          lastPlayDate: progressUpdate.personalBest.lastPlayDate,
          totalProfit: (userProfile.progress.totalProfit || 0) + gameResult.profit
        }
      };

      // Save updated profile
      await this.userAdapter.updateProfile(updatedProfile);

      // Update leaderboards
      await this.leaderboardAdapter.addScoreEntry({
        userId,
        username: userProfile.username,
        score: gameResult.profit,
        powerupUsed: processedReceipts.length > 0,
        timestamp: new Date()
      });

      // Anti-cheat validation
      const validationCheck = await this.securityService.validateGameResult(gameRun, gameResult, userProfile);
      if (!validationCheck.valid) {
        // Log suspicious activity but don't block the result
        console.warn(`Suspicious game result for user ${userId}:`, validationCheck.reason);
      }

      // Generate AI content for enhanced experience
      let aiContent = {};
      try {
        const [marketNews, customerDialogue] = await Promise.all([
          marketNewsGenerator.generateDailyNews(
            gameResult.weather,
            gameResult.event,
            gameResult.festival
          ),
          customerDialogueGenerator.generateCustomerDialogue(
            gameResult.weather,
            gameResult.event,
            price,
            userProfile.gameStats.service,
            gameResult.festival
          )
        ]);

        aiContent = {
          marketNews,
          customerDialogue
        };
      } catch (error) {
        console.error('AI content generation failed:', error);
        // Continue without AI content - it's not critical for gameplay
      }

      // Return successful response
      res.json({
        success: true,
        result: gameResult,
        progress: progressUpdate,
        updatedProfile,
        aiContent,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining - 1,
          resetTime: rateLimitResult.resetTime
        }
      });

    } catch (error) {
      console.error('Game run error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  private validateInput(price: number, adSpend: number): { valid: boolean; error?: string } {
    if (typeof price !== 'number' || price <= 0 || price > 10) {
      return { valid: false, error: 'Invalid price. Must be between $0.01 and $10.00' };
    }

    if (typeof adSpend !== 'number' || adSpend < 0 || adSpend > 100) {
      return { valid: false, error: 'Invalid ad spend. Must be between $0 and $100' };
    }

    return { valid: true };
  }
}

import { Request, Response } from 'express';
import { BonusService, BonusClaimResult, BonusStatusResult } from '../services/bonus-service.js';
import { LoginBonus } from '../bonuses/login-bonus-manager.js';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';
import { LoginBonusType } from '../../shared/types/game.js';

export interface BonusClaimResponse {
  success: boolean;
  bonus?: LoginBonus;
  message: string;
  timeUntilNext?: number;
  error?: string;
}

export interface BonusStatusResponse {
  success: boolean;
  hasBonus: boolean;
  bonus?: LoginBonus;
  canClaim: boolean;
  timeUntilNext: number;
  todaysBonus: LoginBonusType;
  error?: string;
}

export interface BonusPreviewResponse {
  success: boolean;
  bonus?: LoginBonus;
  error?: string;
}

export interface BonusStatsResponse {
  success: boolean;
  stats?: {
    todaysBonus: LoginBonusType;
    timeUntilNext: number;
    bonusDistribution: Record<LoginBonusType, number>;
    upcomingBonuses: Array<{ date: string; bonus: LoginBonusType }>;
  };
  error?: string;
}

export class BonusEndpoint {
  private bonusService: BonusService;
  private userAdapter: UserProfileAdapter;

  constructor() {
    // These would be properly initialized with dependencies in a real implementation
    this.userAdapter = {} as UserProfileAdapter;
    this.bonusService = new BonusService(this.userAdapter);
  }

  /**
   * Claims the daily login bonus for a user
   * POST /api/bonus/claim
   */
  async handleClaimBonus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          error: 'Missing user ID'
        });
        return;
      }

      const result: BonusClaimResult = await this.bonusService.claimDailyBonus(userId);
      
      const response: BonusClaimResponse = {
        success: result.success,
        bonus: result.bonus,
        message: result.message,
        timeUntilNext: result.timeUntilNext
      };

      if (!result.success) {
        response.error = result.message;
      }

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('Error claiming bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim bonus',
        error: 'Internal server error'
      });
    }
  }

  /**
   * Gets the current bonus status for a user
   * GET /api/bonus/status
   */
  async handleGetBonusStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          hasBonus: false,
          canClaim: false,
          timeUntilNext: 0,
          todaysBonus: LoginBonusType.NONE,
          error: 'User ID is required'
        });
        return;
      }

      const result: BonusStatusResult = await this.bonusService.getBonusStatus(userId);
      
      const response: BonusStatusResponse = {
        success: true,
        hasBonus: result.hasBonus,
        bonus: result.bonus,
        canClaim: result.canClaim,
        timeUntilNext: result.timeUntilNext,
        todaysBonus: result.todaysBonus
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting bonus status:', error);
      res.status(500).json({
        success: false,
        hasBonus: false,
        canClaim: false,
        timeUntilNext: 0,
        todaysBonus: LoginBonusType.NONE,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Previews today's available bonus without claiming it
   * GET /api/bonus/preview
   */
  async handlePreviewBonus(req: Request, res: Response): Promise<void> {
    try {
      const bonus: LoginBonus = await this.bonusService.previewTodaysBonus();
      
      const response: BonusPreviewResponse = {
        success: true,
        bonus
      };

      res.json(response);
    } catch (error) {
      console.error('Error previewing bonus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Gets bonus statistics and upcoming bonuses
   * GET /api/bonus/stats
   */
  async handleGetBonusStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.bonusService.getBonusStats();
      
      const response: BonusStatsResponse = {
        success: true,
        stats
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting bonus stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Checks if a user has a specific active bonus
   * GET /api/bonus/check/:bonusType
   */
  async handleCheckActiveBonus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { bonusType } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          hasBonus: false,
          error: 'User ID is required'
        });
        return;
      }

      if (!Object.values(LoginBonusType).includes(bonusType as LoginBonusType)) {
        res.status(400).json({
          success: false,
          hasBonus: false,
          error: 'Invalid bonus type'
        });
        return;
      }

      const hasBonus = await this.bonusService.hasActiveBonus(userId, bonusType as LoginBonusType);
      
      res.json({
        success: true,
        hasBonus,
        bonusType
      });
    } catch (error) {
      console.error('Error checking active bonus:', error);
      res.status(500).json({
        success: false,
        hasBonus: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Gets the user's login streak
   * GET /api/bonus/streak
   */
  async handleGetLoginStreak(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          streak: 0,
          error: 'User ID is required'
        });
        return;
      }

      const streak = await this.bonusService.getLoginStreak(userId);
      
      res.json({
        success: true,
        streak
      });
    } catch (error) {
      console.error('Error getting login streak:', error);
      res.status(500).json({
        success: false,
        streak: 0,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Gets bonus history for a user
   * GET /api/bonus/history?days=7
   */
  async handleGetBonusHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const days = parseInt(req.query.days as string) || 7;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          history: [],
          error: 'User ID is required'
        });
        return;
      }

      if (days < 1 || days > 30) {
        res.status(400).json({
          success: false,
          history: [],
          error: 'Days must be between 1 and 30'
        });
        return;
      }

      const history = await this.bonusService.getBonusHistory(userId, days);
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting bonus history:', error);
      res.status(500).json({
        success: false,
        history: [],
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validates if a user can claim today's bonus
   * GET /api/bonus/validate
   */
  async handleValidateBonusClaim(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          canClaim: false,
          error: 'User ID is required'
        });
        return;
      }

      const validation = await this.bonusService.validateBonusClaim(userId);
      
      res.json({
        success: true,
        canClaim: validation.canClaim,
        reason: validation.reason
      });
    } catch (error) {
      console.error('Error validating bonus claim:', error);
      res.status(500).json({
        success: false,
        canClaim: false,
        error: 'Internal server error'
      });
    }
  }
}

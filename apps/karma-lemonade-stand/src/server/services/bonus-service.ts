import { LoginBonusManager, LoginBonus } from '../bonuses/login-bonus-manager';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';
import { LoginBonusType } from '../../shared/types/game';

export interface BonusClaimResult {
  success: boolean;
  bonus?: LoginBonus | undefined;
  message: string;
  timeUntilNext?: number;
}

export interface BonusStatusResult {
  hasBonus: boolean;
  bonus?: LoginBonus | undefined;
  canClaim: boolean;
  timeUntilNext: number;
  todaysBonus: LoginBonusType;
}

export class BonusService {
  private loginBonusManager: LoginBonusManager;
  private userProfileAdapter: UserProfileAdapter;

  constructor(userProfileAdapter: UserProfileAdapter) {
    this.userProfileAdapter = userProfileAdapter;
    this.loginBonusManager = new LoginBonusManager(userProfileAdapter);
  }

  /**
   * Claims the daily login bonus for a user
   */
  async claimDailyBonus(userId: string): Promise<BonusClaimResult> {
    try {
      // Check if user can claim today's bonus
      const canClaim = await this.loginBonusManager.canClaimTodaysBonus(userId);
      
      if (!canClaim) {
        const existingBonus = await this.loginBonusManager.getUserBonus(userId);
        return {
          success: false,
          bonus: existingBonus || undefined,
          message: 'You have already claimed today\'s bonus!',
          timeUntilNext: this.loginBonusManager.getTimeUntilNextBonus()
        };
      }

      // Claim the bonus
      const bonus = await this.loginBonusManager.claimDailyBonus(userId);
      
      if (!bonus) {
        return {
          success: false,
          message: 'Failed to claim bonus. Please try again.',
          timeUntilNext: this.loginBonusManager.getTimeUntilNextBonus()
        };
      }

      // Update user's last play date to track daily login
      await this.updateLastLoginDate(userId);

      return {
        success: true,
        bonus,
        message: this.getBonusClaimMessage(bonus.type),
        timeUntilNext: this.loginBonusManager.getTimeUntilNextBonus()
      };
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return {
        success: false,
        message: 'An error occurred while claiming your bonus.',
        timeUntilNext: this.loginBonusManager.getTimeUntilNextBonus()
      };
    }
  }

  /**
   * Gets the current bonus status for a user
   */
  async getBonusStatus(userId: string): Promise<BonusStatusResult> {
    try {
      const currentBonus = await this.loginBonusManager.getUserBonus(userId);
      const canClaim = await this.loginBonusManager.canClaimTodaysBonus(userId);
      const todaysBonus = this.loginBonusManager.getCurrentDailyBonus();
      const timeUntilNext = this.loginBonusManager.getTimeUntilNextBonus();

      return {
        hasBonus: currentBonus !== null && currentBonus.claimed,
        bonus: currentBonus || undefined,
        canClaim,
        timeUntilNext,
        todaysBonus
      };
    } catch (error) {
      console.error('Error getting bonus status:', error);
      return {
        hasBonus: false,
        canClaim: false,
        timeUntilNext: this.loginBonusManager.getTimeUntilNextBonus(),
        todaysBonus: LoginBonusType.NONE
      };
    }
  }

  /**
   * Previews today's available bonus without claiming it
   */
  async previewTodaysBonus(): Promise<LoginBonus> {
    return await this.loginBonusManager.previewTodaysBonus();
  }

  /**
   * Gets bonus statistics and upcoming bonuses
   */
  async getBonusStats(): Promise<{
    todaysBonus: LoginBonusType;
    timeUntilNext: number;
    bonusDistribution: Record<LoginBonusType, number>;
    upcomingBonuses: Array<{ date: string; bonus: LoginBonusType }>;
  }> {
    const stats = await this.loginBonusManager.getBonusStats();
    
    // Generate upcoming bonuses for the next 7 days
    const upcomingBonuses = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const bonus = this.loginBonusManager.generateDailyBonus(date);
      
      const dateString = date.toISOString().split('T')[0];
      if (dateString) {
        upcomingBonuses.push({
          date: dateString,
          bonus
        });
      }
    }

    return {
      ...stats,
      upcomingBonuses
    };
  }

  /**
   * Checks if a user has a specific active bonus
   */
  async hasActiveBonus(userId: string, bonusType: LoginBonusType): Promise<boolean> {
    return await this.loginBonusManager.hasActiveBonus(userId, bonusType);
  }

  /**
   * Gets the user's login streak (for future streak-based bonuses)
   */
  async getLoginStreak(userId: string): Promise<number> {
    try {
      const profile = await this.userProfileAdapter.getProfile(userId);
      if (!profile) {
        return 0;
      }

      // Calculate login streak based on consecutive days
      const today = new Date().toISOString().split('T')[0] || '';
      const lastPlayDate = profile.progress.lastPlayDate;
      
      if (!lastPlayDate) {
        return 0;
      }

      const lastPlay = new Date(lastPlayDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastPlay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Played today, return current streak
        return profile.progress.currentStreak || 0;
      } else if (daysDiff === 1) {
        // Played yesterday, can continue streak
        return profile.progress.currentStreak || 0;
      } else {
        // Streak broken
        return 0;
      }
    } catch (error) {
      console.error('Error getting login streak:', error);
      return 0;
    }
  }

  /**
   * Updates the user's last login date
   */
  private async updateLastLoginDate(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0] || '';
    await this.userProfileAdapter.updateProgress(userId, {
      lastPlayDate: today
    });
  }

  /**
   * Gets a user-friendly message for bonus claims
   */
  private getBonusClaimMessage(bonusType: LoginBonusType): string {
    const messages = {
      [LoginBonusType.NONE]: 'No special bonus today, but thanks for playing!',
      [LoginBonusType.PERFECT]: 'Perfect Day bonus claimed! Enjoy +15% revenue on your next run.',
      [LoginBonusType.FREE_AD]: 'Free Advertising bonus claimed! You get 2 free ad credits.',
      [LoginBonusType.COOLER]: 'Cooler bonus claimed! Cold weather won\'t affect your sales today.'
    };

    return messages[bonusType] || 'Bonus claimed successfully!';
  }

  /**
   * Validates bonus claim eligibility
   */
  async validateBonusClaim(userId: string): Promise<{
    canClaim: boolean;
    reason?: string;
  }> {
    try {
      const profile = await this.userProfileAdapter.getProfile(userId);
      if (!profile) {
        return {
          canClaim: false,
          reason: 'User profile not found'
        };
      }

      const canClaim = await this.loginBonusManager.canClaimTodaysBonus(userId);
      if (!canClaim) {
        return {
          canClaim: false,
          reason: 'Already claimed today\'s bonus'
        };
      }

      return { canClaim: true };
    } catch (error) {
      console.error('Error validating bonus claim:', error);
      return {
        canClaim: false,
        reason: 'Validation error'
      };
    }
  }

  /**
   * Gets bonus history for a user (for analytics)
   */
  async getBonusHistory(_userId: string, days: number = 7): Promise<Array<{
    date: string;
    bonusType: LoginBonusType;
    claimed: boolean;
  }>> {
    // This would typically be stored in Redis for analytics
    // For now, we'll return a placeholder implementation
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const bonusType = this.loginBonusManager.generateDailyBonus(date);
      
      if (dateString) {
        history.push({
          date: dateString,
          bonusType,
          claimed: i === 0 // Only today's bonus might be claimed
        });
      }
    }
    
    return history;
  }
}

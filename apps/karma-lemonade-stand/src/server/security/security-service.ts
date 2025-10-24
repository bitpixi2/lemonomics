import { RateLimiter, RateLimitResult, RateLimitStatus } from './rate-limiter';
import { GameValidator, GameRunValidation } from './game-validator';
import { GameRun, GameResult, UserProfile, DailyCycle, WeeklyCycle } from '../../shared/types/game';

export interface SecurityCheckResult {
  allowed: boolean;
  rateLimitResult: RateLimitResult;
  validationResult?: GameRunValidation | undefined;
  securityScore: number; // 0-100, higher = more secure/trustworthy
  actions: SecurityAction[];
}

export interface SecurityAction {
  type: 'log' | 'warn' | 'block' | 'monitor';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityStats {
  rateLimiting: {
    totalChecks: number;
    blocked: number;
    averageWaitTime: number;
  };
  validation: {
    totalValidations: number;
    failed: number;
    averageRiskScore: number;
  };
  security: {
    suspiciousUsers: number;
    blockedAttempts: number;
    falsePositives: number;
  };
}

export class SecurityService {
  private rateLimiter: RateLimiter;
  private gameValidator: GameValidator;

  constructor(rateLimiter: RateLimiter, gameValidator: GameValidator) {
    this.rateLimiter = rateLimiter;
    this.gameValidator = gameValidator;
  }

  /**
   * Performs comprehensive security check before allowing a game run
   */
  async checkGameRunSecurity(
    gameRun: GameRun,
    userProfile: UserProfile,
    dailyCycle: DailyCycle,
    weeklyCycle: WeeklyCycle,
    clientResult?: GameResult
  ): Promise<SecurityCheckResult> {
    const actions: SecurityAction[] = [];
    let securityScore = 100; // Start with perfect score, deduct for issues

    // Check rate limits first
    const rateLimitResult = await this.rateLimiter.checkGameRunLimit(gameRun.userId);
    
    if (!rateLimitResult.allowed) {
      securityScore -= 30;
      actions.push({
        type: 'block',
        reason: rateLimitResult.reason || 'Rate limit exceeded',
        severity: 'medium'
      });

      return {
        allowed: false,
        rateLimitResult,
        securityScore,
        actions
      };
    }

    // Perform validation if client result is provided
    let validationResult: GameRunValidation | undefined;
    if (clientResult) {
      validationResult = await this.gameValidator.validateGameRun(
        gameRun,
        userProfile,
        dailyCycle,
        weeklyCycle,
        clientResult
      );

      // Adjust security score based on validation
      if (!validationResult.overallValid) {
        securityScore -= 40;
        actions.push({
          type: 'block',
          reason: 'Game validation failed',
          severity: 'high'
        });

        return {
          allowed: false,
          rateLimitResult,
          validationResult,
          securityScore,
          actions
        };
      }

      // Deduct points for warnings and suspicious patterns
      const totalRiskScore = validationResult.inputValidation.riskScore + validationResult.resultValidation.riskScore;
      securityScore -= Math.min(30, totalRiskScore / 2);

      if (validationResult.suspiciousPatterns.length > 0) {
        securityScore -= validationResult.suspiciousPatterns.length * 10;
        actions.push({
          type: 'monitor',
          reason: `Suspicious patterns detected: ${validationResult.suspiciousPatterns.join(', ')}`,
          severity: 'medium'
        });
      }
    }

    // Check for additional security concerns
    const suspiciousActivity = await this.rateLimiter.checkSuspiciousActivity(gameRun.userId);
    if (suspiciousActivity.suspicious) {
      securityScore -= 20;
      actions.push({
        type: suspiciousActivity.riskLevel === 'high' ? 'warn' : 'monitor',
        reason: `Suspicious activity: ${suspiciousActivity.reasons.join(', ')}`,
        severity: suspiciousActivity.riskLevel
      });
    }

    // Log all security checks
    actions.push({
      type: 'log',
      reason: 'Security check completed',
      severity: 'low'
    });

    const allowed = securityScore >= 50; // Require minimum security score

    return {
      allowed,
      rateLimitResult,
      validationResult,
      securityScore,
      actions
    };
  }

  /**
   * Records a successful game run for security tracking
   */
  async recordSecureGameRun(
    userId: string,
    gameRun: GameRun,
    validation?: GameRunValidation
  ): Promise<void> {
    try {
      // Record for rate limiting
      await this.rateLimiter.recordGameRun(userId);

      // Log validation results if available
      if (validation) {
        await this.gameValidator.logValidationResult(userId, validation, gameRun);
      }

      // Additional security logging
      await this.logSecurityEvent(userId, 'game_run_completed', {
        price: gameRun.price,
        adSpend: gameRun.adSpend,
        powerupUsed: (gameRun.powerupReceipts?.length || 0) > 0,
        validationPassed: validation?.overallValid ?? true
      });
    } catch (error) {
      console.error('Error recording secure game run:', error);
    }
  }

  /**
   * Gets rate limit status for a user
   */
  async getUserRateLimitStatus(userId: string): Promise<RateLimitStatus> {
    return await this.rateLimiter.getRateLimitStatus(userId);
  }

  /**
   * Gets security statistics for monitoring
   */
  async getSecurityStats(hours: number = 24): Promise<SecurityStats> {
    try {
      // Get validation stats
      const validationStats = await this.gameValidator.getValidationStats(hours);
      
      // Get rate limit violations
      const rateLimitViolations = await this.rateLimiter.getRateLimitViolations(hours);
      
      return {
        rateLimiting: {
          totalChecks: rateLimitViolations.length + validationStats.totalValidations,
          blocked: rateLimitViolations.length,
          averageWaitTime: 30 // Placeholder
        },
        validation: {
          totalValidations: validationStats.totalValidations,
          failed: validationStats.invalidRuns,
          averageRiskScore: validationStats.averageRiskScore
        },
        security: {
          suspiciousUsers: 0, // Placeholder
          blockedAttempts: rateLimitViolations.length + validationStats.invalidRuns,
          falsePositives: 0 // Placeholder
        }
      };
    } catch (error) {
      console.error('Error getting security stats:', error);
      return {
        rateLimiting: { totalChecks: 0, blocked: 0, averageWaitTime: 0 },
        validation: { totalValidations: 0, failed: 0, averageRiskScore: 0 },
        security: { suspiciousUsers: 0, blockedAttempts: 0, falsePositives: 0 }
      };
    }
  }

  /**
   * Handles security violations
   */
  async handleSecurityViolation(
    userId: string,
    violationType: string,
    details: any
  ): Promise<void> {
    try {
      await this.logSecurityEvent(userId, 'security_violation', {
        type: violationType,
        details,
        timestamp: Date.now()
      });

      // In a real implementation, this might:
      // - Temporarily ban the user
      // - Increase monitoring
      // - Send alerts to administrators
      // - Update user risk scores

      console.warn(`Security violation for user ${userId}: ${violationType}`, details);
    } catch (error) {
      console.error('Error handling security violation:', error);
    }
  }

  /**
   * Resets daily security limits
   */
  async resetDailyLimits(): Promise<void> {
    try {
      await this.rateLimiter.resetDailyLimits();
      console.log('Daily security limits reset');
    } catch (error) {
      console.error('Error resetting daily security limits:', error);
    }
  }

  /**
   * Gets user security profile
   */
  async getUserSecurityProfile(userId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    rateLimitStatus: RateLimitStatus;
    recentViolations: number;
    trustScore: number; // 0-100
    recommendations: string[];
  }> {
    try {
      const rateLimitStatus = await this.getUserRateLimitStatus(userId);
      const suspiciousActivity = await this.rateLimiter.checkSuspiciousActivity(userId);
      
      // Calculate trust score based on various factors
      let trustScore = 100;
      
      if (suspiciousActivity.suspicious) {
        trustScore -= suspiciousActivity.riskLevel === 'high' ? 40 : 20;
      }
      
      if (rateLimitStatus.postsToday > rateLimitStatus.maxPostsPerDay * 0.8) {
        trustScore -= 15;
      }

      const riskLevel = trustScore < 40 ? 'high' : trustScore < 70 ? 'medium' : 'low';
      
      const recommendations: string[] = [];
      if (riskLevel === 'high') {
        recommendations.push('Account flagged for manual review');
        recommendations.push('Increased monitoring recommended');
      } else if (riskLevel === 'medium') {
        recommendations.push('Monitor for unusual patterns');
      }

      return {
        riskLevel,
        rateLimitStatus,
        recentViolations: 0, // Placeholder
        trustScore,
        recommendations
      };
    } catch (error) {
      console.error('Error getting user security profile:', error);
      return {
        riskLevel: 'medium',
        rateLimitStatus: await this.getUserRateLimitStatus(userId),
        recentViolations: 0,
        trustScore: 50,
        recommendations: ['Error retrieving security profile']
      };
    }
  }

  /**
   * Logs security events for monitoring
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        eventType,
        timestamp: Date.now(),
        data
      };

      // In a real implementation, this would store in Redis or a logging system
      console.log('Security event:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}

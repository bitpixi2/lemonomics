import { GameRun, GameResult, UserProfile, DailyCycle, WeeklyCycle } from '../../shared/types/game';
import { GameConfig } from '../../shared/types/config';
import { GameEngine } from '../engine/game-engine';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100, higher = more suspicious
}

export interface GameRunValidation {
  inputValidation: ValidationResult;
  resultValidation: ValidationResult;
  overallValid: boolean;
  suspiciousPatterns: string[];
}

export class GameValidator {
  private config: GameConfig;
  private gameEngine: GameEngine;

  constructor(config: GameConfig, gameEngine: GameEngine) {
    this.config = config;
    this.gameEngine = gameEngine;
  }

  /**
   * Validates a complete game run from input to result
   */
  async validateGameRun(
    gameRun: GameRun,
    userProfile: UserProfile,
    dailyCycle: DailyCycle,
    weeklyCycle: WeeklyCycle,
    clientResult: GameResult
  ): Promise<GameRunValidation> {
    // Validate inputs
    const inputValidation = this.validateGameInputs(gameRun, userProfile);
    
    // Recalculate result server-side
    const serverResult = await this.gameEngine.runGame(gameRun, userProfile, dailyCycle, weeklyCycle);
    
    // Validate result against server calculation
    const resultValidation = this.validateGameResult(clientResult, serverResult, gameRun);
    
    // Check for suspicious patterns
    const suspiciousPatterns = await this.detectSuspiciousPatterns(gameRun, clientResult, userProfile);
    
    const overallValid = inputValidation.valid && resultValidation.valid && suspiciousPatterns.length === 0;

    return {
      inputValidation,
      resultValidation,
      overallValid,
      suspiciousPatterns
    };
  }

  /**
   * Validates game run inputs
   */
  validateGameInputs(gameRun: GameRun, userProfile: UserProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // Validate price range
    if (gameRun.price < this.config.game.minPrice || gameRun.price > this.config.game.maxPrice) {
      errors.push(`Price ${gameRun.price} outside valid range (${this.config.game.minPrice}-${this.config.game.maxPrice})`);
      riskScore += 30;
    }

    // Validate advertising spend
    if (gameRun.adSpend < this.config.game.minAdSpend || gameRun.adSpend > this.config.game.maxAdSpend) {
      errors.push(`Ad spend ${gameRun.adSpend} outside valid range (${this.config.game.minAdSpend}-${this.config.game.maxAdSpend})`);
      riskScore += 30;
    }

    // Validate user ID matches profile
    if (gameRun.userId !== userProfile.userId) {
      errors.push('User ID mismatch between game run and profile');
      riskScore += 50;
    }

    // Check for suspicious precision (e.g., too many decimal places)
    if (this.hasSuspiciousPrecision(gameRun.price) || this.hasSuspiciousPrecision(gameRun.adSpend)) {
      warnings.push('Unusual precision in input values');
      riskScore += 10;
    }

    // Validate power-up receipts if present
    if (gameRun.powerupReceipts) {
      for (const receipt of gameRun.powerupReceipts) {
        if (!this.isValidReceiptFormat(receipt)) {
          errors.push(`Invalid power-up receipt format: ${receipt.receiptId}`);
          riskScore += 25;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskScore
    };
  }

  /**
   * Validates game result against server calculation
   */
  validateGameResult(clientResult: GameResult, serverResult: GameResult, gameRun: GameRun): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // Allow small tolerance for floating point differences
    const tolerance = 0.01;

    // Validate profit
    const profitDiff = Math.abs(clientResult.profit - serverResult.profit);
    if (profitDiff > tolerance) {
      errors.push(`Profit mismatch: client=${clientResult.profit}, server=${serverResult.profit}, diff=${profitDiff}`);
      riskScore += 40;
    }

    // Validate cups sold
    if (clientResult.cupsSold !== serverResult.cupsSold) {
      errors.push(`Cups sold mismatch: client=${clientResult.cupsSold}, server=${serverResult.cupsSold}`);
      riskScore += 35;
    }

    // Validate environmental factors
    if (clientResult.weather !== serverResult.weather) {
      errors.push(`Weather mismatch: client=${clientResult.weather}, server=${serverResult.weather}`);
      riskScore += 20;
    }

    if (clientResult.event !== serverResult.event) {
      errors.push(`Event mismatch: client=${clientResult.event}, server=${serverResult.event}`);
      riskScore += 20;
    }

    if (clientResult.festival !== serverResult.festival) {
      errors.push(`Festival mismatch: client=${clientResult.festival}, server=${serverResult.festival}`);
      riskScore += 15;
    }

    // Validate seed consistency
    if (clientResult.seed !== serverResult.seed) {
      errors.push(`Seed mismatch: client=${clientResult.seed}, server=${serverResult.seed}`);
      riskScore += 30;
    }

    // Check for impossible results
    if (this.isImpossibleResult(clientResult, gameRun)) {
      errors.push('Result contains impossible values');
      riskScore += 50;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskScore
    };
  }

  /**
   * Detects suspicious patterns in gameplay
   */
  async detectSuspiciousPatterns(
    gameRun: GameRun,
    result: GameResult,
    userProfile: UserProfile
  ): Promise<string[]> {
    const patterns: string[] = [];

    // Check for consistently perfect results
    if (this.isPerfectResult(result, gameRun)) {
      patterns.push('Suspiciously optimal result');
    }

    // Check for unusual timing patterns
    if (this.hasUnusualTiming(userProfile)) {
      patterns.push('Unusual timing patterns detected');
    }

    // Check for impossible score progression
    if (this.hasImpossibleProgression(result, userProfile)) {
      patterns.push('Impossible score progression');
    }

    // Check for bot-like behavior
    if (this.showsBotLikeBehavior(gameRun, userProfile)) {
      patterns.push('Bot-like behavior detected');
    }

    return patterns;
  }

  /**
   * Validates that a result is mathematically possible
   */
  private isImpossibleResult(result: GameResult, gameRun: GameRun): boolean {
    // Check for negative cups sold
    if (result.cupsSold < 0) {
      return true;
    }

    // Check for impossibly high profit margins
    const revenue = result.cupsSold * gameRun.price;
    if (result.profit > revenue) {
      return true; // Profit can't exceed revenue
    }

    // Check for impossibly low costs (profit shouldn't be much higher than revenue)
    const maxReasonableProfit = revenue * 0.95; // 95% profit margin is already very high
    if (result.profit > maxReasonableProfit && result.cupsSold > 10) {
      return true;
    }

    return false;
  }

  /**
   * Checks if a result is suspiciously perfect
   */
  private isPerfectResult(result: GameResult, gameRun: GameRun): boolean {
    // Check for round numbers that are unlikely to occur naturally
    if (result.profit % 1 === 0 && result.profit > 50) {
      return true; // Perfect whole number profits are suspicious for high values
    }

    // Check for optimal price points that are too consistent
    const optimalPrice = 2.5; // Hypothetical optimal price
    if (Math.abs(gameRun.price - optimalPrice) < 0.01) {
      return true; // Too close to theoretical optimum
    }

    return false;
  }

  /**
   * Checks for unusual timing patterns
   */
  private hasUnusualTiming(_userProfile: UserProfile): boolean {
    // This would analyze timing patterns from user history
    // For now, we'll return false as placeholder
    return false;
  }

  /**
   * Checks for impossible score progression
   */
  private hasImpossibleProgression(result: GameResult, userProfile: UserProfile): boolean {
    // Check if the score is impossibly higher than previous best
    const improvement = result.profit - userProfile.progress.bestProfit;
    const improvementRatio = userProfile.progress.bestProfit > 0 
      ? improvement / userProfile.progress.bestProfit 
      : 0;

    // Flag improvements of more than 500% as suspicious
    return improvementRatio > 5.0 && userProfile.progress.totalRuns > 5;
  }

  /**
   * Checks for bot-like behavior patterns
   */
  private showsBotLikeBehavior(gameRun: GameRun, userProfile: UserProfile): boolean {
    // Check for too-precise inputs (bots often use exact values)
    const priceStr = gameRun.price.toString();
    const adSpendStr = gameRun.adSpend.toString();
    
    // Flag inputs with more than 2 decimal places as suspicious
    if (priceStr.includes('.') && priceStr.split('.')[1]?.length > 2) {
      return true;
    }
    
    if (adSpendStr.includes('.') && adSpendStr.split('.')[1]?.length > 2) {
      return true;
    }

    // Check for repetitive patterns
    if (userProfile.progress.totalRuns > 10) {
      // This would analyze historical patterns for repetitive behavior
      // For now, we'll return false as placeholder
    }

    return false;
  }

  /**
   * Checks if a number has suspicious precision
   */
  private hasSuspiciousPrecision(value: number): boolean {
    const str = value.toString();
    if (!str.includes('.')) {
      return false;
    }
    
    const decimalPlaces = str.split('.')[1]?.length || 0;
    return decimalPlaces > 3; // More than 3 decimal places is suspicious
  }

  /**
   * Validates receipt format
   */
  private isValidReceiptFormat(receipt: any): boolean {
    return (
      receipt &&
      typeof receipt.receiptId === 'string' &&
      typeof receipt.userId === 'string' &&
      typeof receipt.sku === 'string' &&
      typeof receipt.amount === 'number' &&
      typeof receipt.currency === 'string' &&
      typeof receipt.signature === 'string' &&
      typeof receipt.issuedAt === 'number'
    );
  }

  /**
   * Gets validation statistics for monitoring
   */
  async getValidationStats(_hours: number = 24): Promise<{
    totalValidations: number;
    validRuns: number;
    invalidRuns: number;
    averageRiskScore: number;
    commonErrors: Array<{ error: string; count: number }>;
    suspiciousPatterns: Array<{ pattern: string; count: number }>;
  }> {
    // This would typically query validation logs from Redis
    // For now, we'll return placeholder data
    return {
      totalValidations: 0,
      validRuns: 0,
      invalidRuns: 0,
      averageRiskScore: 0,
      commonErrors: [],
      suspiciousPatterns: []
    };
  }

  /**
   * Logs validation results for monitoring
   */
  async logValidationResult(
    userId: string,
    validation: GameRunValidation,
    gameRun: GameRun
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        timestamp: Date.now(),
        valid: validation.overallValid,
        riskScore: validation.inputValidation.riskScore + validation.resultValidation.riskScore,
        errors: [...validation.inputValidation.errors, ...validation.resultValidation.errors],
        suspiciousPatterns: validation.suspiciousPatterns,
        gameRun: {
          price: gameRun.price,
          adSpend: gameRun.adSpend,
          powerupCount: gameRun.powerupReceipts?.length || 0
        }
      };

      // In a real implementation, this would store in Redis or a logging system
      console.log('Validation log:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Error logging validation result:', error);
    }
  }
}

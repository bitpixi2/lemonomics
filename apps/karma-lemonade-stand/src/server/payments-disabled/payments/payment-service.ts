import { PaymentReceipt } from '../../shared/types/game';
import { GameConfig } from '../../shared/types/config';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter';

export interface PaymentResult {
  success: boolean;
  receiptId?: string;
  message: string;
  error?: string;
}

export interface PurchaseRequest {
  userId: string;
  sku: string;
  amount: number;
  currency: string;
}

export class PaymentService {
  private config: GameConfig;
  private userProfileAdapter: UserProfileAdapter;

  constructor(config: GameConfig, userProfileAdapter: UserProfileAdapter) {
    this.config = config;
    this.userProfileAdapter = userProfileAdapter;
  }

  /**
   * Processes a power-up purchase using Devvit Payments
   */
  async processPurchase(request: PurchaseRequest): Promise<PaymentResult> {
    try {
      // Validate the purchase request
      const validation = await this.validatePurchase(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.reason || 'Purchase validation failed'
        };
      }

      // Check daily limits
      const canPurchase = await this.checkDailyLimits(request.userId, request.sku);
      if (!canPurchase.allowed) {
        return {
          success: false,
          message: canPurchase.reason || 'Daily purchase limit exceeded'
        };
      }

      // Generate receipt ID
      const receiptId = this.generateReceiptId(request.userId, request.sku);

      // Create payment receipt
      const receipt: PaymentReceipt = {
        receiptId,
        userId: request.userId,
        sku: request.sku,
        amount: request.amount,
        currency: request.currency,
        signature: this.generateSignature(receiptId, request),
        issuedAt: Date.now()
      };

      // Store receipt for verification
      await this.storeReceipt(receipt);

      // Update user's power-up usage count
      await this.updatePowerupUsage(request.userId, request.sku);

      return {
        success: true,
        receiptId,
        message: 'Purchase completed successfully'
      };
    } catch (error) {
      console.error('Error processing purchase:', error);
      return {
        success: false,
        message: 'Payment processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verifies a payment receipt
   */
  async verifyReceipt(receiptId: string): Promise<{
    valid: boolean;
    receipt?: PaymentReceipt;
    reason?: string;
  }> {
    try {
      const receipt = await this.getStoredReceipt(receiptId);
      
      if (!receipt) {
        return {
          valid: false,
          reason: 'Receipt not found'
        };
      }

      // Verify signature
      const expectedSignature = this.generateSignature(receiptId, {
        userId: receipt.userId,
        sku: receipt.sku,
        amount: receipt.amount,
        currency: receipt.currency
      });

      if (receipt.signature !== expectedSignature) {
        return {
          valid: false,
          reason: 'Invalid receipt signature'
        };
      }

      // Check if receipt is not too old (24 hours)
      const receiptAge = Date.now() - receipt.issuedAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (receiptAge > maxAge) {
        return {
          valid: false,
          reason: 'Receipt expired'
        };
      }

      return {
        valid: true,
        receipt
      };
    } catch (error) {
      console.error('Error verifying receipt:', error);
      return {
        valid: false,
        reason: 'Receipt verification failed'
      };
    }
  }

  /**
   * Gets available power-ups for purchase
   */
  getAvailablePowerups(): Array<{
    sku: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    dailyLimit: number;
    effects: string[];
  }> {
    const powerups = [];
    
    for (const [sku, config] of Object.entries(this.config.payments.powerups)) {
      powerups.push({
        sku,
        name: this.getPowerupName(sku),
        description: this.getPowerupDescription(sku),
        price: config.price,
        currency: config.currency,
        dailyLimit: config.dailyLimit,
        effects: this.getPowerupEffects(config.effects)
      });
    }
    
    return powerups;
  }

  /**
   * Gets user's remaining daily purchase limits
   */
  async getUserPurchaseLimits(userId: string): Promise<Record<string, {
    used: number;
    limit: number;
    remaining: number;
  }>> {
    const limits: Record<string, { used: number; limit: number; remaining: number }> = {};
    
    for (const [sku, config] of Object.entries(this.config.payments.powerups)) {
      const used = await this.getDailyUsageCount(userId, sku);
      const limit = config.dailyLimit;
      const remaining = Math.max(0, limit - used);
      
      limits[sku] = { used, limit, remaining };
    }
    
    return limits;
  }

  /**
   * Validates a purchase request
   */
  private async validatePurchase(request: PurchaseRequest): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // Check if SKU exists
    const powerupConfig = this.config.payments.powerups[request.sku];
    if (!powerupConfig) {
      return {
        valid: false,
        reason: 'Invalid power-up SKU'
      };
    }

    // Check price and currency
    if (request.amount !== powerupConfig.price) {
      return {
        valid: false,
        reason: 'Invalid purchase amount'
      };
    }

    if (request.currency !== powerupConfig.currency) {
      return {
        valid: false,
        reason: 'Invalid currency'
      };
    }

    // Check user profile exists
    const profile = await this.userProfileAdapter.getProfile(request.userId);
    if (!profile) {
      return {
        valid: false,
        reason: 'User profile not found'
      };
    }

    return { valid: true };
  }

  /**
   * Checks daily purchase limits for a user
   */
  private async checkDailyLimits(userId: string, sku: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const powerupConfig = this.config.payments.powerups[sku];
    if (!powerupConfig) {
      return {
        allowed: false,
        reason: 'Invalid power-up'
      };
    }

    const usageCount = await this.getDailyUsageCount(userId, sku);
    
    if (usageCount >= powerupConfig.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of ${powerupConfig.dailyLimit} purchases exceeded`
      };
    }

    return { allowed: true };
  }

  /**
   * Gets daily usage count for a power-up
   */
  private async getDailyUsageCount(userId: string, sku: string): Promise<number> {
    const usage = await this.userProfileAdapter.getPowerupUsage(userId);
    return usage[sku] || 0;
  }

  /**
   * Updates power-up usage count
   */
  private async updatePowerupUsage(userId: string, sku: string): Promise<void> {
    await this.userProfileAdapter.incrementPowerupUsage(userId, sku);
  }

  /**
   * Generates a unique receipt ID
   */
  private generateReceiptId(userId: string, sku: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${userId}_${sku}_${timestamp}_${random}`;
  }

  /**
   * Generates a signature for receipt verification
   */
  private generateSignature(receiptId: string, request: PurchaseRequest): string {
    const data = `${receiptId}:${request.userId}:${request.sku}:${request.amount}:${request.currency}`;
    
    // Simple hash function for signature (in production, use proper cryptographic signing)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Stores payment receipt
   */
  private async storeReceipt(receipt: PaymentReceipt): Promise<void> {
    // In a real implementation, this would store in Redis
    // For now, we'll use a placeholder
    console.log('Storing receipt:', receipt.receiptId);
  }

  /**
   * Retrieves stored receipt
   */
  private async getStoredReceipt(receiptId: string): Promise<PaymentReceipt | null> {
    // In a real implementation, this would retrieve from Redis
    // For now, we'll return null as placeholder
    console.log('Retrieving receipt:', receiptId);
    return null;
  }

  /**
   * Gets user-friendly power-up name
   */
  private getPowerupName(sku: string): string {
    const names: Record<string, string> = {
      'super_sugar_boost': 'Super Sugar Boost'
    };
    return names[sku] || sku;
  }

  /**
   * Gets power-up description
   */
  private getPowerupDescription(sku: string): string {
    const descriptions: Record<string, string> = {
      'super_sugar_boost': 'Boost your lemonade with premium sugar for increased demand and service quality'
    };
    return descriptions[sku] || 'Power-up enhancement';
  }

  /**
   * Gets power-up effects as string array
   */
  private getPowerupEffects(effects: any): string[] {
    if (effects.type === 'SUPER_SUGAR') {
      return [
        `+${Math.round(effects.demandBonus * 100)}% demand boost`,
        `+${effects.serviceBonus} service quality`,
        'Single run duration'
      ];
    }
    return ['Unknown effects'];
  }
}

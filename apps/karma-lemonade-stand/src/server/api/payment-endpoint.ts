import { Request, Response } from 'express';
import { PaymentService } from '../payments/payment-service.js';
import { PowerupManager } from '../payments/powerup-manager.js';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';

export interface PurchaseRequest {
  sku: string;
  quantity?: number;
}

export interface PurchaseResponse {
  success: boolean;
  receiptId?: string;
  powerupStatus?: any;
  error?: string;
}

export interface PowerupStatusResponse {
  success: boolean;
  powerups?: {
    [sku: string]: {
      usedToday: number;
      dailyLimit: number;
      canUse: boolean;
    };
  };
  error?: string;
}

export class PaymentEndpoint {
  private paymentService: PaymentService;
  private powerupManager: PowerupManager;
  private userAdapter: UserProfileAdapter;

  constructor() {
    this.paymentService = new PaymentService();
    this.powerupManager = new PowerupManager();
    this.userAdapter = new UserProfileAdapter();
  }

  async handlePurchase(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { sku, quantity = 1 } = req.body as PurchaseRequest;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing user ID'
        });
        return;
      }

      if (!sku) {
        res.status(400).json({
          success: false,
          error: 'Missing SKU'
        });
        return;
      }

      // Validate SKU
      const validSkus = ['super_sugar', 'perfect_day', 'free_ad'];
      if (!validSkus.includes(sku)) {
        res.status(400).json({
          success: false,
          error: 'Invalid SKU'
        });
        return;
      }

      // Check if user can purchase this power-up
      const canPurchase = await this.powerupManager.canUsePowerupSimple(userId, sku);
      if (!canPurchase) {
        res.status(400).json({
          success: false,
          error: 'Daily limit reached for this power-up'
        });
        return;
      }

      // Process payment
      const paymentResult = await this.paymentService.processPurchase(userId, sku, quantity);
      
      if (!paymentResult.success) {
        res.status(400).json({
          success: false,
          error: paymentResult.error
        });
        return;
      }

      // Get updated power-up status
      const powerupStatus = await this.getPowerupStatus(userId);

      res.json({
        success: true,
        receiptId: paymentResult.receiptId,
        powerupStatus
      });

    } catch (error) {
      console.error('Purchase endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process purchase'
      });
    }
  }

  async handleGetPowerupStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing user ID'
        });
        return;
      }

      const powerupStatus = await this.getPowerupStatus(userId);

      res.json({
        success: true,
        powerups: powerupStatus
      });

    } catch (error) {
      console.error('Powerup status endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get power-up status'
      });
    }
  }

  async handleVerifyReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.body;

      if (!receiptId) {
        res.status(400).json({
          success: false,
          error: 'Missing receipt ID'
        });
        return;
      }

      const verificationResult = await this.paymentService.verifyReceipt(receiptId);

      res.json({
        success: verificationResult.valid,
        receipt: verificationResult.valid ? verificationResult.receipt : undefined,
        error: verificationResult.valid ? undefined : 'Invalid receipt'
      });

    } catch (error) {
      console.error('Receipt verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify receipt'
      });
    }
  }

  private async getPowerupStatus(userId: string) {
    const userProfile = await this.userAdapter.getProfile(userId);
    if (!userProfile) {
      return {};
    }

    const powerupSkus = ['super_sugar', 'perfect_day', 'free_ad'];
    const status: any = {};

    for (const sku of powerupSkus) {
      const usedToday = userProfile.powerups.usedToday[sku] || 0;
      const dailyLimit = this.powerupManager.getDailyLimit(sku);
      
      status[sku] = {
        usedToday,
        dailyLimit,
        canUse: usedToday < dailyLimit
      };
    }

    return status;
  }
}

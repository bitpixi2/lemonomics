// API request/response types
import type { GameResult, UserProfile, Leaderboard, DailyCycle, WeeklyCycle } from './game.js';

// API Request types
export interface ScoreRunRequest {
  price: number;
  adSpend: number;
  powerupReceipts?: string[]; // Receipt IDs
}

export interface PurchasePowerupRequest {
  sku: string;
  receiptId: string;
}

// API Response types
export interface ScoreRunResponse {
  success: boolean;
  result?: GameResult;
  error?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard?: Leaderboard;
  error?: string;
}

export interface CurrentCycleResponse {
  success: boolean;
  daily?: DailyCycle;
  weekly?: WeeklyCycle;
  error?: string;
}

export interface PurchaseResponse {
  success: boolean;
  powerupApplied?: boolean;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    redis: boolean;
    reddit: boolean;
  };
}

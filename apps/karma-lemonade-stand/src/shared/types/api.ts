// API request/response types for Lemonomics
import type { 
  GameState, 
  DayResult, 
  UserProfile, 
  LeaderboardEntry, 
  DialogueResponse,
  GameSession,
  LoginBonus,
  DayInput,
  GameEndResult
} from './game.js';

// API Request types
export interface StartGameRequest {
  // No parameters needed - uses Reddit user context from Devvit
}

export interface PlayDayRequest extends DayInput {
  sessionId: string;
}

export interface EndGameRequest {
  sessionId: string;
}

export interface ClaimLoginBonusRequest {
  // No parameters needed - uses Reddit user context
}

export interface GetAIContentRequest {
  weather: string;
  festival: string;
  salesPerformance: 'good' | 'average' | 'poor';
  day: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface StartGameResponse extends ApiResponse<{
  gameSession: GameSession;
  userProfile: UserProfile;
  loginBonus?: LoginBonus;
}> {}

export interface PlayDayResponse extends ApiResponse<{
  dayResult: DayResult;
  updatedGameState: GameState;
  aiContent?: DialogueResponse;
}> {}

export interface EndGameResponse extends ApiResponse<GameEndResult> {}

export interface UserProfileResponse extends ApiResponse<UserProfile> {}

export interface LeaderboardResponse extends ApiResponse<{
  leaderboard: LeaderboardEntry[];
  playerPosition?: number;
  totalPlayers: number;
}> {}

export interface LoginBonusResponse extends ApiResponse<{
  bonus: LoginBonus;
  newStreak: number;
  totalBonusAmount: number;
}> {}

export interface AIContentResponse extends ApiResponse<DialogueResponse> {}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    redis: boolean;
    ai: boolean;
  };
  version: string;
}

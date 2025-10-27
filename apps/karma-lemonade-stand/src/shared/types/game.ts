// Core game data types for Lemonomics
export interface GameState {
  day: number;
  cash: number;
  inventory: {
    lemons: number;
    sugar: number;
    cups: number;
  };
  weather: WeatherType;
  festival: FestivalTheme;
  karmaBoost: KarmaBoost;
  isFirstDay: boolean;
}

export interface DayResult {
  day: number;
  cupsSold: number;
  revenue: number;
  costs: number;
  profit: number;
  weather: WeatherType;
  festival: FestivalTheme;
  customerDialogue: string[];
  pricePerCup: number;
  ingredientsPurchased: {
    lemons: number;
    sugar: number;
    cups: number;
  };
}

export interface UserProfile {
  userId: string;
  username: string;
  redditKarma: number;
  karmaBoost: KarmaBoost;
  stats: {
    gamesPlayed: number;
    bestCash: number;
    totalDaysPlayed: number;
    lastPlayDate: string;
  };
  streakData: StreakData;
}

export interface GameSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  currentDay: number;
  cash: number;
  inventory: {
    lemons: number;
    sugar: number;
    cups: number;
  };
  dailyResults: DayResult[];
  isActive: boolean;
  totalDaysPlayed: number;
  lastPlayedRealDate: string; // ISO date string of last real day played
  canPlayToday: boolean; // Whether user can play today
  nextPlayDate: string; // ISO date string of when they can play next
}

export interface RedditUserData {
  username: string;
  totalKarma: number;
  accountAge: number;
}

export interface KarmaBoost {
  multiplier: number;
  level: 'none' | 'bronze' | 'silver' | 'gold';
  description: string;
  threshold: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  finalCash: number;
  daysPlayed: number;
  timestamp: Date;
  isCurrentPlayer?: boolean;
}

export interface LoginBonus {
  amount: number;
  type: 'daily' | 'streak';
  streakDay?: number;
  description: string;
}

export interface StreakData {
  currentStreak: number;
  lastPlayDate: string;
  longestStreak: number;
  bonusesEarned: LoginBonus[];
}

export enum WeatherType {
  SUNNY = 'sunny',
  WINDY = 'windy',
  RAINY = 'rainy'
}

export enum FestivalTheme {
  SUMMER = 'summer',
  CHRISTMAS = 'christmas',
  HALLOWEEN = 'halloween',
  MEDIEVAL = 'medieval',
  FESTIVAL = 'festival'
}

export interface DialogueRequest {
  weather: WeatherType;
  festival: FestivalTheme;
  salesPerformance: 'good' | 'average' | 'poor';
  day: number;
}

export interface DialogueResponse {
  customerComments: string[];
  flavorText?: string;
}

export interface AudioTheme {
  festival: FestivalTheme;
  audioFile: string;
  volume: number;
}

export interface AudioState {
  currentTheme: FestivalTheme;
  isPlaying: boolean;
  volume: number;
}

// Reddit Integration Interfaces
export interface RedditIntegrationService {
  getUserData(userId: string): Promise<RedditUserData>;
  calculateKarmaBoost(karma: number): KarmaBoost;
}

// AI Service Interfaces
export interface AIService {
  generateCustomerDialogue(request: DialogueRequest): Promise<DialogueResponse>;
  isAvailable(): boolean;
}

export interface AIServiceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Game Engine Interfaces
export interface GameEngine {
  startNewGame(userId: string): Promise<GameSession>;
  playDay(sessionId: string, dayInput: DayInput): Promise<DayResult>;
  endGame(sessionId: string): Promise<GameEndResult>;
}

export interface DayInput {
  lemons: number;
  sugar: number;
  cups: number;
  pricePerCup: number;
}

export interface GameEndResult {
  finalCash: number;
  totalDays: number;
  leaderboardPosition: number;
  leaderboard: LeaderboardEntry[];
}

// Calculation Interfaces
export interface DemandCalculation {
  baseCustomers: number;
  weatherMultiplier: number;
  karmaMultiplier: number;
  priceElasticity: number;
  finalDemand: number;
}

export interface ProfitCalculation {
  revenue: number;
  ingredientCosts: number;
  profit: number;
  breakdown: {
    cupsSold: number;
    pricePerCup: number;
    lemonCost: number;
    sugarCost: number;
    cupCost: number;
  };
}

// Achievement and Flair System
export interface Achievement {
  id: string;
  name: string;
  description: string;
  cashThreshold: number;
  flairTemplateId: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface FlairReward {
  templateId: string;
  cashThreshold: number;
  name: string;
  description: string;
}

export const FLAIR_REWARDS: FlairReward[] = [
  {
    templateId: '2b6eecf8-b254-11f0-8c08-226f6c7bd5e2',
    cashThreshold: 10.00,
    name: 'Lemon Apprentice',
    description: 'Earned your first $10 in the lemonade business!'
  },
  {
    templateId: '7844575c-b254-11f0-8b2d-d62f5c13ad44',
    cashThreshold: 100.00,
    name: 'Citrus Tycoon',
    description: 'Built a successful $100 lemonade empire!'
  },
  {
    templateId: 'a776e332-b254-11f0-8d07-9eb8e1ecefd1',
    cashThreshold: 1000.00,
    name: 'Global Lemonade Hero',
    description: 'Achieved the legendary $1,000 milestone!'
  }
];

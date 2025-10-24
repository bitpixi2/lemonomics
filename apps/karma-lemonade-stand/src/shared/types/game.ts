// Core game data types
export interface UserProfile {
  userId: string;
  username: string;
  redditStats: {
    postKarma: number;
    commentKarma: number;
    accountAgeDays: number;
    awards: number;
    lastUpdated: Date;
  };
  gameStats: {
    service: number;
    marketing: number;
    reputation: number;
  };
  progress: {
    totalRuns?: number;
    currentStreak?: number;
    longestStreak?: number;
    bestProfit?: number;
    lastPlayDate?: string;
    totalProfit?: number;
  };
  powerups: {
    usedToday: Record<string, number>;
    lastResetDate: string;
  };
}

export interface GameRun {
  userId: string;
  price: number;
  adSpend: number;
  powerupReceipts?: PaymentReceipt[];
}

export interface GameResult {
  profit: number;
  cupsSold: number;
  weather: WeatherType;
  event: MarketEvent;
  festival: string; // Festival theme ID
  streak: number;
  seed: string;
  powerupsApplied: string[];
}

export interface UserStats {
  postKarma: number;
  commentKarma: number;
  accountAgeDays: number;
  awards: number;
  service: number;
  marketing: number;
  reputation: number;
}

export interface RedditUserData {
  username: string;
  postKarma: number;
  commentKarma: number;
  accountCreated: Date;
  totalAwards: number;
}

export interface PaymentReceipt {
  receiptId: string;
  userId: string;
  sku: string;
  amount: number;
  currency: string;
  signature: string;
  issuedAt: number;
}

export enum WeatherType {
  SUNNY = 'SUNNY',
  HOT = 'HOT',
  CLOUDY = 'CLOUDY',
  RAINY = 'RAINY',
  COLD = 'COLD'
}

export enum MarketEvent {
  NONE = 'NONE',
  VIRAL = 'VIRAL',
  SUGAR_SHORT = 'SUGAR_SHORT',
  INFLATION = 'INFLATION'
}

export enum LoginBonusType {
  NONE = 'NONE',
  PERFECT = 'PERFECT',
  FREE_AD = 'FREE_AD',
  COOLER = 'COOLER'
}

export interface DailyCycle {
  date: string;
  seed: string;
  weather: WeatherType;
  lemonPrice: number;
  sugarPrice: number;
  event: MarketEvent;
  multipliers: {
    demand: Record<WeatherType, number>;
    event: Record<MarketEvent, number>;
    cost: Record<MarketEvent, number>;
  };
  loginBonus: LoginBonusType;
}

export interface WeeklyCycle {
  week: number;
  year: number;
  festival: string; // Festival theme ID
  modifiers: FestivalModifiers;
}

export interface FestivalModifiers {
  demandMultiplier: number;
  priceVariance: number;
  criticalSaleChance: number;
  costVolatility: number;
  specialEffects: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  powerupUsed: boolean;
  timestamp: Date;
}

export interface Leaderboard {
  type: 'daily' | 'weekly';
  date: string;
  entries: LeaderboardEntry[];
  pure?: LeaderboardEntry[]; // No power-ups
}

export interface ResultPost {
  title: string;
  imageUrl: string;
  buttons: PostButton[];
  footer: string;
}

export interface PostButton {
  label: string;
  action: string;
  url?: string;
}

// FestivalTheme is defined in config.ts to avoid circular dependency

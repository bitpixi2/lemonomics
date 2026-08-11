export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type FlairReward = {
  day: number;
  flairId: string;
  name: string;
  description: string;
};

export type CheckFlairResponse = {
  type: 'flair-check';
  awarded: boolean;
  flair?: FlairReward;
  message: string;
};

export type GameProgressRequest = {
  currentDay: number;
  totalProfit: number;
};

export type LeaderboardEntry = {
  username: string;
  day: number;
  assets: number;
  lastUpdated: string;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  topPlayers: LeaderboardEntry[];
};

export type UpdateProgressRequest = {
  day: number;
  assets: number;
};

export type GamePhase = 'intro' | 'dayBriefing' | 'setup' | 'results' | 'gameOver';

export type GameState = {
  day: number;
  cash: number;
  glasses: number;
  signs: number;
  price: number;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'hot';
  assets: number;
  bankrupt: boolean;
};

export type DayResult = {
  glassesSold: number;
  income: number;
  expenses: number;
  profit: number;
  specialEvent?: string;
};

export type SavedGame = {
  phase: Exclude<GamePhase, 'intro'>;
  gameState: GameState;
  dayResult: DayResult | null;
  savedAt: string;
};

export type GameSaveResponse =
  | { type: 'game-save'; saved: false }
  | { type: 'game-save'; saved: true; game: SavedGame };

export type SupporterStatusResponse = {
  type: 'supporter-status';
  supporter: boolean;
};

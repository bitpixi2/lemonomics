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
  canResetTestSupporter: boolean;
};

export type SupporterResetResponse = {
  type: 'supporter-reset';
  supporter: false;
  reset: boolean;
  message: string;
};

export type DailySpinCategory = 'recipe' | 'image';

export type DailySpinChallenge = {
  id: string;
  category: DailySpinCategory;
  emoji: string;
  label: string;
  prompt: string;
  commentStarter: string;
};

export const DAILY_SPIN_CHALLENGES = [
  {
    id: 'classic-lemon-recipe',
    category: 'recipe',
    emoji: '🥤',
    label: 'Classic Recipe',
    prompt: 'Share a lemon recipe with its ingredients and the key step that makes it work.',
    commentStarter:
      '🍋 My Daily Lemon Spin: Classic Recipe\n\nRecipe name:\nIngredients:\nKey step:\nWhy I recommend it:',
  },
  {
    id: 'lemon-recipe-remix',
    category: 'recipe',
    emoji: '🧁',
    label: 'Recipe Remix',
    prompt: 'Share a lemon recipe that uses one surprising ingredient, swap, or serving idea.',
    commentStarter:
      '🍋 My Daily Lemon Spin: Recipe Remix\n\nRecipe name:\nThe lemony twist:\nIngredients:\nKey step:',
  },
  {
    id: 'original-lemon-photo',
    category: 'image',
    emoji: '📸',
    label: 'Lemon Photo',
    prompt: 'Post an original lemon photo you took and tell the community what is happening in it.',
    commentStarter:
      '🍋 My Daily Lemon Spin: Lemon Photo\n\nCaption:\nHow I made this image:\nImage description (skip personal or location details):',
  },
  {
    id: 'lemon-art',
    category: 'image',
    emoji: '🎨',
    label: 'Lemon Art',
    prompt:
      'Post lemon art, a drawing, or a lemon-themed creation you made and add a short caption.',
    commentStarter:
      '🍋 My Daily Lemon Spin: Lemon Art\n\nTitle:\nHow I made it:\nImage description:',
  },
] as const satisfies readonly DailySpinChallenge[];

export type DailySpinResponse = {
  type: 'daily-spin';
  date: string;
  signedIn: boolean;
  spun: boolean;
  challenge?: DailySpinChallenge;
  commentUrl?: string;
  message?: string;
};

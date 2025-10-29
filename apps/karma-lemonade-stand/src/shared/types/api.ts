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

import express from 'express';
import type {
  DailySpinChallenge,
  DailySpinResponse,
  DayResult,
  DecrementResponse,
  GamePhase,
  GameSaveResponse,
  GameState,
  IncrementResponse,
  InitResponse,
  SavedGame,
  SupporterResetResponse,
  SupporterStatusResponse,
} from '../shared/types/api';
import { DAILY_SPIN_CHALLENGES } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import type { PaymentHandlerResponse } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

const GOLDEN_LEMON_SUPPORTER_SKU = 'golden-lemon-supporter';
const SUPPORTER_TEST_RESET_USER_ID = 't2_jdl8h';
const SUPPORTER_TEST_SUBREDDIT = 'lemonomics_game_dev';
const SUPPORTER_TEST_RESET_ID = 'bitpixi-2026-08-12';
const DAILY_SPIN_ANCHOR_TEXT = `🍋 **Daily Lemon Spin submissions**

Spin the free daily wheel in Lemonomics, then reply to this pinned comment with the lemon recipe or original lemon image it gives you.

- Recipe prompts: include the ingredients and the key step.
- Image prompts: use Reddit's image button and add a caption or image description.

Only share content you made or have permission to post. Participation is optional and does not affect gameplay, rewards, or Reddit Gold.`;

type DailySpinAnchor = {
  id: `t1_${string}`;
  url: string;
};

type PaymentOrder = {
  status: string;
  products: Array<{ sku: string }>;
};

const canResetTestSupporter = (): boolean =>
  context.userId === SUPPORTER_TEST_RESET_USER_ID &&
  context.subredditName.toLowerCase() === SUPPORTER_TEST_SUBREDDIT;

const applyPendingSupporterTestReset = async (): Promise<void> => {
  const { userId } = context;
  if (!userId || !canResetTestSupporter()) return;

  const resetMarkerKey = `supporter-test-reset:${SUPPORTER_TEST_RESET_ID}:${userId}`;
  if (await redis.get(resetMarkerKey)) return;

  await redis.del(`supporter:${userId}`);
  await redis.set(resetMarkerKey, new Date().toISOString());
};

const getUtcDate = (): string => new Date().toISOString().slice(0, 10);

const getDailySpinChallenge = (id: string): DailySpinChallenge | undefined =>
  DAILY_SPIN_CHALLENGES.find((challenge) => challenge.id === id);

const getPostUrl = (postId: `t3_${string}`): string =>
  `https://www.reddit.com/comments/${postId.slice(3)}`;

const readDailySpinAnchor = async (
  postId: `t3_${string}`
): Promise<DailySpinAnchor | undefined> => {
  const key = `daily-spin-anchor:${postId}`;
  const stored = await redis.get(key);
  if (!stored) return undefined;

  try {
    const anchor: unknown = JSON.parse(stored);
    if (
      !anchor ||
      typeof anchor !== 'object' ||
      typeof (anchor as Partial<DailySpinAnchor>).id !== 'string' ||
      !(anchor as Partial<DailySpinAnchor>).id?.startsWith('t1_') ||
      typeof (anchor as Partial<DailySpinAnchor>).url !== 'string' ||
      !(anchor as Partial<DailySpinAnchor>).url?.startsWith('https://www.reddit.com/')
    ) {
      throw new Error('Daily spin anchor failed validation');
    }

    return anchor as DailySpinAnchor;
  } catch (error) {
    console.error('Invalid daily spin anchor:', error);
    await redis.del(key);
    return undefined;
  }
};

const ensureDailySpinAnchor = async (postId: `t3_${string}`): Promise<string> => {
  const existing = await readDailySpinAnchor(postId);
  if (existing) return existing.url;

  const lockKey = `daily-spin-anchor-lock:${postId}`;
  const lock = await redis.set(lockKey, 'creating', {
    nx: true,
    expiration: new Date(Date.now() + 60_000),
  });

  if (!lock) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const anchor = await readDailySpinAnchor(postId);
      if (anchor) return anchor.url;
    }

    throw new Error('Timed out waiting for the daily spin comment thread');
  }

  const comment = await reddit.submitComment({
    id: postId,
    text: DAILY_SPIN_ANCHOR_TEXT,
    runAs: 'APP',
  });

  try {
    await comment.distinguish(true);
  } catch (error) {
    await comment.delete().catch(() => undefined);
    throw error;
  }

  const anchor: DailySpinAnchor = {
    id: comment.id,
    url: `https://www.reddit.com${comment.permalink}`,
  };
  await redis.set(`daily-spin-anchor:${postId}`, JSON.stringify(anchor));
  return anchor.url;
};

const isGamePhase = (value: unknown): value is Exclude<GamePhase, 'intro'> =>
  value === 'dayBriefing' || value === 'setup' || value === 'results' || value === 'gameOver';

const isGameState = (value: unknown): value is GameState => {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<GameState>;
  return (
    Number.isInteger(game.day) &&
    (game.day ?? 0) >= 1 &&
    (game.day ?? 0) <= 30 &&
    typeof game.cash === 'number' &&
    Number.isFinite(game.cash) &&
    typeof game.assets === 'number' &&
    Number.isFinite(game.assets) &&
    Number.isInteger(game.glasses) &&
    Number.isInteger(game.signs) &&
    Number.isInteger(game.price) &&
    typeof game.bankrupt === 'boolean' &&
    ['sunny', 'cloudy', 'rainy', 'hot'].includes(game.weather ?? '')
  );
};

const isDayResult = (value: unknown): value is DayResult => {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<DayResult>;
  return (
    Number.isInteger(result.glassesSold) &&
    typeof result.income === 'number' &&
    Number.isFinite(result.income) &&
    typeof result.expenses === 'number' &&
    Number.isFinite(result.expenses) &&
    typeof result.profit === 'number' &&
    Number.isFinite(result.profit)
  );
};

const isSavedGame = (value: unknown): value is SavedGame => {
  if (!value || typeof value !== 'object') return false;
  const saved = value as Partial<SavedGame>;
  return (
    isGamePhase(saved.phase) &&
    isGameState(saved.gameState) &&
    (saved.dayResult === null || isDayResult(saved.dayResult))
  );
};

// Called by Reddit after a completed Gold purchase.
router.post<string, never, PaymentHandlerResponse, PaymentOrder>(
  '/internal/payments/fulfill',
  async (req, res): Promise<void> => {
    try {
      const { userId } = context;
      const order = req.body;

      if (!userId) {
        res.json({ success: false, reason: 'Sign in to support Lemonomics.' });
        return;
      }

      if (
        order.status !== 'PAID' ||
        !order.products.some((product) => product.sku === GOLDEN_LEMON_SUPPORTER_SKU)
      ) {
        res.json({ success: false, reason: 'The Golden Lemon purchase could not be verified.' });
        return;
      }

      await redis.set(`supporter:${userId}`, 'true');
      res.json({ success: true });
    } catch (error) {
      console.error('Support purchase fulfillment error:', error);
      res.json({ success: false, reason: 'Unable to activate Golden Lemon Supporter.' });
    }
  }
);

router.post<string, never, PaymentHandlerResponse, PaymentOrder>(
  '/internal/payments/refund',
  async (req, res): Promise<void> => {
    try {
      const { userId } = context;
      const order = req.body;

      if (userId && order.products.some((product) => product.sku === GOLDEN_LEMON_SUPPORTER_SKU)) {
        await redis.del(`supporter:${userId}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Support purchase refund error:', error);
      res.json({ success: false, reason: 'Unable to remove Golden Lemon Supporter.' });
    }
  }
);

router.get<object, SupporterStatusResponse>(
  '/api/supporter-status',
  async (_req, res): Promise<void> => {
    const { userId } = context;
    await applyPendingSupporterTestReset();
    const supporter = userId ? Boolean(await redis.get(`supporter:${userId}`)) : false;
    res.json({
      type: 'supporter-status',
      supporter,
      canResetTestSupporter: canResetTestSupporter(),
    });
  }
);

router.delete<object, SupporterResetResponse | { message: string }>(
  '/api/supporter-status',
  async (_req, res): Promise<void> => {
    const { userId } = context;

    if (!userId || !canResetTestSupporter()) {
      res
        .status(403)
        .json({ message: 'This test reset is only available to bitpixi in the dev subreddit.' });
      return;
    }

    const supporterKey = `supporter:${userId}`;
    const reset = Boolean(await redis.get(supporterKey));
    await redis.del(supporterKey);
    res.json({
      type: 'supporter-reset',
      supporter: false,
      reset,
      message: reset
        ? 'Your dev supporter test state was reset. No Reddit Gold was charged.'
        : 'Your dev supporter test state was already clear. No Reddit Gold was charged.',
    });
  }
);

router.get<object, DailySpinResponse>('/api/daily-spin', async (_req, res): Promise<void> => {
  const { userId, postId } = context;
  const date = getUtcDate();

  if (!userId) {
    res.json({
      type: 'daily-spin',
      date,
      signedIn: false,
      spun: false,
      message: 'Sign in to Reddit to take your daily spin.',
    });
    return;
  }

  const storedChallengeId = await redis.get(`daily-spin:${date}:${userId}`);
  const challenge = storedChallengeId ? getDailySpinChallenge(storedChallengeId) : undefined;
  const anchor = postId ? await readDailySpinAnchor(postId) : undefined;

  const response: DailySpinResponse = {
    type: 'daily-spin',
    date,
    signedIn: true,
    spun: Boolean(challenge),
  };
  if (challenge) response.challenge = challenge;
  if (anchor?.url) response.commentUrl = anchor.url;
  else if (postId) response.commentUrl = getPostUrl(postId);
  res.json(response);
});

router.post<object, DailySpinResponse>('/api/daily-spin', async (_req, res): Promise<void> => {
  const { userId, postId } = context;
  const date = getUtcDate();

  if (!userId) {
    res.status(401).json({
      type: 'daily-spin',
      date,
      signedIn: false,
      spun: false,
      message: 'Sign in to Reddit to take your daily spin.',
    });
    return;
  }

  const spinKey = `daily-spin:${date}:${userId}`;
  const storedChallengeId = await redis.get(spinKey);
  let challenge = getDailySpinChallenge(storedChallengeId ?? '');

  if (storedChallengeId && !challenge) {
    await redis.del(spinKey);
  }

  if (!challenge) {
    const candidate =
      DAILY_SPIN_CHALLENGES[Math.floor(Math.random() * DAILY_SPIN_CHALLENGES.length)] ??
      DAILY_SPIN_CHALLENGES[0];
    await redis.set(spinKey, candidate.id, {
      nx: true,
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    });
    challenge = getDailySpinChallenge((await redis.get(spinKey)) ?? '');
  }

  if (!challenge) {
    res.status(500).json({
      type: 'daily-spin',
      date,
      signedIn: true,
      spun: false,
      message: 'The wheel did not settle. Please try again.',
    });
    return;
  }

  let commentUrl = postId ? getPostUrl(postId) : undefined;
  if (postId) {
    try {
      commentUrl = await ensureDailySpinAnchor(postId);
    } catch (error) {
      console.error('Unable to prepare daily spin comment thread:', error);
    }
  }

  const response: DailySpinResponse = {
    type: 'daily-spin',
    date,
    signedIn: true,
    spun: true,
    challenge,
  };
  if (commentUrl) response.commentUrl = commentUrl;
  res.json(response);
});

router.get<object, GameSaveResponse>('/api/game-save', async (_req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.json({ type: 'game-save', saved: false });
    return;
  }

  const value = await redis.get(`game-save:${userId}`);
  if (!value) {
    res.json({ type: 'game-save', saved: false });
    return;
  }

  try {
    const game: unknown = JSON.parse(value);
    if (!isSavedGame(game)) throw new Error('Saved game failed validation');
    res.json({ type: 'game-save', saved: true, game });
  } catch (error) {
    console.error('Invalid saved game:', error);
    await redis.del(`game-save:${userId}`);
    res.json({ type: 'game-save', saved: false });
  }
});

router.post<object, GameSaveResponse, SavedGame>(
  '/api/game-save',
  async (req, res): Promise<void> => {
    const { userId } = context;
    if (!userId || !isSavedGame(req.body)) {
      res.json({ type: 'game-save', saved: false });
      return;
    }

    const game: SavedGame = { ...req.body, savedAt: new Date().toISOString() };
    await redis.set(`game-save:${userId}`, JSON.stringify(game), {
      expiration: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    });
    res.json({ type: 'game-save', saved: true, game });
  }
);

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Flair reward configuration
const FLAIR_REWARDS = [
  {
    day: 10,
    flairId: '2b6eecf8-b254-11f0-8c08-226f6c7bd5e2',
    name: 'Lemon Apprentice',
    description: 'Mastered the basics of the lemonade business',
  },
  {
    day: 20,
    flairId: '7844575c-b254-11f0-8b2d-d62f5c13ad44',
    name: 'Citrus Tycoon',
    description: 'A true entrepreneur with serious business skills',
  },
  {
    day: 30,
    flairId: 'a776e332-b254-11f0-8d07-9eb8e1ecefd1',
    name: 'Global Lemonade Hero',
    description: 'Conquered the lemonade world!',
  },
];

// Update player progress for leaderboard
router.post('/api/update-progress', async (req, res): Promise<void> => {
  try {
    const { day, assets } = req.body as { day: number; assets: number };
    const { userId } = context;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID required',
      });
      return;
    }

    // Get current username
    const currentUsername = await reddit.getCurrentUsername();
    if (!currentUsername) {
      res.status(400).json({
        status: 'error',
        message: 'Unable to get username',
      });
      return;
    }

    // Store player progress in Redis
    const playerKey = `player:${userId}`;
    const playerData = {
      username: currentUsername,
      day: day,
      assets: assets,
      lastUpdated: new Date().toISOString(),
    };

    await redis.set(playerKey, JSON.stringify(playerData));

    // Add to leaderboard sorted set (sorted by assets, then by day)
    const score = assets * 1000 + day; // Assets are primary, day is tiebreaker
    await redis.zAdd('leaderboard', { member: userId, score: score });

    res.json({
      status: 'success',
      message: 'Progress updated',
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update progress',
    });
  }
});

// Reset player data (for bankruptcy/restart)
router.post('/api/reset-player', async (_req, res): Promise<void> => {
  try {
    const { userId } = context;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID required',
      });
      return;
    }

    // Remove player from leaderboard
    await redis.zRem('leaderboard', [userId]);

    // Remove player data
    const playerKey = `player:${userId}`;
    await redis.del(playerKey);
    await redis.del(`game-save:${userId}`);

    console.log(`🔄 Reset player data for user: ${userId}`);

    res.json({
      status: 'success',
      message: 'Player data reset successfully',
    });
  } catch (error) {
    console.error('Reset player error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset player data',
    });
  }
});

// Health check endpoint for Kiro hook monitoring
router.get('/api/health', async (_req, res): Promise<void> => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Lemonomics Game Server',
      version: '1.0.0',
      uptime: process.uptime(),
      features: {
        leaderboard: true,
        flair_awarding: true,
        karma_boost: true,
        game_mechanics: true,
      },
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Subscribe user to r/Lemonomics
router.post('/api/subscribe-lemonomics', async (_req, res): Promise<void> => {
  try {
    const currentUser = await reddit.getCurrentUser();

    if (!currentUser) {
      res.status(400).json({
        status: 'error',
        message: 'Unable to get current user',
      });
      return;
    }

    // Subscribe user to current subreddit (r/Lemonomics)
    // This requires SUBSCRIBE_TO_SUBREDDIT permission in devvit.json
    try {
      await reddit.subscribeToCurrentSubreddit();
      console.log(`✅ Subscribed user ${currentUser.username} to r/Lemonomics`);

      res.json({
        status: 'success',
        message: `Successfully subscribed to r/Lemonomics!`,
        username: currentUser.username,
      });
    } catch (subscribeError) {
      console.error('Subscription failed:', subscribeError);

      // Fallback: provide manual subscription guidance
      res.json({
        status: 'info',
        message: `Please visit r/Lemonomics to subscribe manually for the full experience!`,
        username: currentUser.username,
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process subscription request',
    });
  }
});

// Get leaderboard top 3
router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  try {
    // Get top 3 players from sorted set (highest scores first)
    const topPlayerIds = await redis.zRange('leaderboard', 0, 2, { by: 'rank', reverse: true });

    const topPlayers = [];

    for (const playerId of topPlayerIds) {
      try {
        const playerKey = `player:${playerId}`;
        const playerDataStr = await redis.get(playerKey);

        if (playerDataStr) {
          const playerData = JSON.parse(playerDataStr);
          topPlayers.push({
            username: playerData.username,
            day: playerData.day,
            assets: playerData.assets,
            lastUpdated: playerData.lastUpdated,
          });
        }
      } catch (parseError) {
        console.error('Error parsing player data:', parseError);
        // Skip this player if data is corrupted
      }
    }

    res.json({
      type: 'leaderboard',
      topPlayers: topPlayers,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.json({
      type: 'leaderboard',
      topPlayers: [],
    });
  }
});

// Check and award flair based on game progress
router.post('/api/check-flair', async (req, res): Promise<void> => {
  try {
    const { currentDay } = req.body as { currentDay: number };
    const { userId, subredditName } = context;

    if (!userId || !subredditName) {
      res.json({
        type: 'flair-check',
        awarded: false,
        message: 'User context not available',
      });
      return;
    }

    // Find the highest flair reward the user qualifies for
    const qualifiedReward = FLAIR_REWARDS.filter((reward) => currentDay >= reward.day).sort(
      (a, b) => b.day - a.day
    )[0]; // Get the highest day reward

    if (!qualifiedReward) {
      const nextReward = FLAIR_REWARDS.find((reward) => currentDay < reward.day);
      const nextDay = nextReward ? nextReward.day : 30;
      res.json({
        type: 'flair-check',
        awarded: false,
        message: `Keep playing! Next reward at Day ${nextDay}`,
      });
      return;
    }

    // Check if user already has this flair
    const flairCacheKey = `flair:${userId}:${qualifiedReward.day}`;
    const alreadyAwarded = await redis.get(flairCacheKey);

    if (alreadyAwarded) {
      res.json({
        type: 'flair-check',
        awarded: false,
        flair: qualifiedReward,
        message: `You already have the ${qualifiedReward.name} flair!`,
      });
      return;
    }

    // Award the flair
    try {
      // Only award flair in r/Lemonomics
      if (subredditName.toLowerCase() === 'lemonomics') {
        const currentUsername = await reddit.getCurrentUsername();
        if (!currentUsername) {
          throw new Error('Unable to get current username');
        }

        await reddit.setUserFlair({
          subredditName: 'Lemonomics',
          username: currentUsername,
          flairTemplateId: qualifiedReward.flairId,
        });

        // Mark as awarded in cache
        await redis.set(flairCacheKey, 'awarded');

        res.json({
          type: 'flair-check',
          awarded: true,
          flair: qualifiedReward,
          message: `🎉 Congratulations! You've earned the ${qualifiedReward.name} flair in r/Lemonomics!`,
        });
      } else {
        // Still mark progress but explain flair is only in r/Lemonomics
        await redis.set(flairCacheKey, 'awarded');

        res.json({
          type: 'flair-check',
          awarded: true,
          flair: qualifiedReward,
          message: `🎉 Achievement unlocked: ${qualifiedReward.name}! Visit r/Lemonomics to see your flair.`,
        });
      }
    } catch (flairError) {
      console.error('Error awarding flair:', flairError);
      res.json({
        type: 'flair-check',
        awarded: false,
        flair: qualifiedReward,
        message: `Achievement reached but flair award failed. Contact moderators in r/Lemonomics.`,
      });
    }
  } catch (error) {
    console.error('Flair check error:', error);
    res.json({
      type: 'flair-check',
      awarded: false,
      message: 'Error checking flair eligibility',
    });
  }
});

// Karma boost endpoint for lemonade game
router.get('/api/karma-boost', async (_req, res): Promise<void> => {
  try {
    const { userId } = context;

    if (!userId) {
      res.json({
        multiplier: 1.0,
        level: 'none',
        description: 'No karma boost available',
        totalKarma: 0,
      });
      return;
    }

    // Check Redis cache first
    const cacheKey = `karma:${userId}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    // Get user's Reddit karma
    const currentUser = await reddit.getCurrentUser();
    const totalKarma = (currentUser?.linkKarma || 0) + (currentUser?.commentKarma || 0);

    // Calculate karma boost
    let multiplier = 1.0;
    let level = 'none';
    let description = 'No karma boost';

    if (totalKarma >= 5000) {
      multiplier = 2.0;
      level = 'legendary';
      description = '🏆 Legendary Redditor: 2x sales boost!';
    } else if (totalKarma >= 1000) {
      multiplier = 1.5;
      level = 'veteran';
      description = '⭐ Veteran Redditor: 1.5x sales boost!';
    } else if (totalKarma >= 300) {
      multiplier = 1.15;
      level = 'active';
      description = '👍 Active Redditor: 1.15x sales boost!';
    } else {
      description = `Build your Reddit karma to unlock sales boosts! (Current: ${totalKarma})`;
    }

    const karmaData = {
      multiplier,
      level,
      description,
      totalKarma,
    };

    // Cache for 1 hour (3600 seconds)
    await redis.set(cacheKey, JSON.stringify(karmaData), {
      expiration: new Date(Date.now() + 3600000),
    });

    res.json(karmaData);
  } catch (error) {
    console.error('Karma boost error:', error);
    res.json({
      multiplier: 1.0,
      level: 'none',
      description: 'Error loading karma boost',
      totalKarma: 0,
    });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

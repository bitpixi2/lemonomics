import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

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
        game_mechanics: true
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
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
        username: currentUser.username
      });
    } catch (subscribeError) {
      console.error('Subscription failed:', subscribeError);
      
      // Fallback: provide manual subscription guidance
      res.json({
        status: 'info',
        message: `Please visit r/Lemonomics to subscribe manually for the full experience!`,
        username: currentUser.username,
        fallback: true
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

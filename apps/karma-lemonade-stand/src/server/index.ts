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

// Karma boost endpoint for lemonade game
router.get('/api/karma-boost', async (_req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.json({
        multiplier: 1.0,
        level: 'none',
        description: 'No karma boost available',
        totalKarma: 0
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
      multiplier = 1.5;
      level = 'legendary';
      description = '🏆 Legendary Redditor: 1.5x sales boost!';
    } else if (totalKarma >= 1000) {
      multiplier = 1.3;
      level = 'veteran';
      description = '⭐ Veteran Redditor: 1.3x sales boost!';
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
      totalKarma
    };

    // Cache for 1 hour (3600 seconds)
    await redis.setEx(cacheKey, 3600, JSON.stringify(karmaData));

    res.json(karmaData);
  } catch (error) {
    console.error('Karma boost error:', error);
    res.json({
      multiplier: 1.0,
      level: 'none',
      description: 'Error loading karma boost',
      totalKarma: 0
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

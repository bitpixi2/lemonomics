import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { 
  createDrinkPost, 
  handleDrinkVote, 
  getDrinkPostData,
  type CreateDrinkPostOptions 
} from './posts/submit-drink-post.js';
import { 
  createComponentPost, 
  handleComponentVote,
  type CreateComponentPostOptions 
} from './posts/submit-component-post.js';
import { 
  createVoteFeedPost, 
  getDrinkVoteFeed, 
  getComponentVoteFeed,
  processVote 
} from './posts/vote-feed-post.js';
import { 
  createFeaturedMenuPost, 
  getFeaturedMenuData 
} from './posts/featured-menu-post.js';

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
    const post = await createFeaturedMenuPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.postId}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// New API endpoints for Bitpixi's Bar

// Submit drink from game client
router.post('/api/submit-drink', async (req, res): Promise<void> => {
  try {
    const { drink, imageUrl, authorUid } = req.body as CreateDrinkPostOptions;
    
    if (!drink || !imageUrl || !authorUid) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: drink, imageUrl, authorUid',
      });
      return;
    }

    const result = await createDrinkPost({ drink, imageUrl, authorUid });
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error submitting drink:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to submit drink',
    });
  }
});

// Submit custom component
router.post('/api/submit-component', async (req, res): Promise<void> => {
  try {
    const componentData = req.body as CreateComponentPostOptions;
    
    if (!componentData.component || !componentData.authorUid) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: component, authorUid',
      });
      return;
    }

    const result = await createComponentPost(componentData);
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error submitting component:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to submit component',
    });
  }
});

// Vote on drink or component
router.post('/api/vote', async (req, res): Promise<void> => {
  try {
    const { itemId, itemType, userId, voteDirection } = req.body;
    
    if (!itemId || !itemType || !userId || !voteDirection) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: itemId, itemType, userId, voteDirection',
      });
      return;
    }

    if (voteDirection !== 1 && voteDirection !== -1) {
      res.status(400).json({
        status: 'error',
        message: 'voteDirection must be 1 or -1',
      });
      return;
    }

    const result = await processVote(itemId, itemType, userId, voteDirection);
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to process vote',
    });
  }
});

// Get vote feed data
router.get('/api/vote-feed/:type', async (req, res): Promise<void> => {
  try {
    const { type } = req.params;
    const { userId, page = '0', limit = '10' } = req.query;
    
    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'userId is required',
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let result;
    if (type === 'drinks') {
      result = await getDrinkVoteFeed(userId as string, pageNum, limitNum);
    } else if (type === 'components') {
      result = await getComponentVoteFeed(userId as string, pageNum, limitNum);
    } else {
      res.status(400).json({
        status: 'error',
        message: 'type must be "drinks" or "components"',
      });
      return;
    }
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error getting vote feed:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get vote feed',
    });
  }
});

// Get featured menu data
router.get('/api/featured-menu', async (_req, res): Promise<void> => {
  try {
    const result = await getFeaturedMenuData();
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error getting featured menu:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get featured menu',
    });
  }
});

// Get drink data
router.get('/api/drink/:drinkId', async (req, res): Promise<void> => {
  try {
    const { drinkId } = req.params;
    
    if (!drinkId) {
      res.status(400).json({
        status: 'error',
        message: 'drinkId is required',
      });
      return;
    }

    const result = await getDrinkPostData(drinkId);
    
    if (!result) {
      res.status(404).json({
        status: 'error',
        message: 'Drink not found',
      });
      return;
    }
    
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error getting drink data:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get drink data',
    });
  }
});

app.use(router);

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());

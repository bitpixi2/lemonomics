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

// Process recipe submissions from ModMail (called by Kiro hook)
router.post('/api/process-recipes', async (_req, res): Promise<void> => {
  try {
    console.log('🍋 Starting ModMail recipe processing...');
    
    // Get ModMail conversations
    const conversations = await reddit.modMail.getConversations({
      subreddits: ['Lemonomics'],
      state: 'new',
      limit: 10
    });

    let processedCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    const processedConversations: string[] = [];

    // Convert conversations object to array
    const conversationArray = Object.values(conversations.conversations || {});
    console.log(`📬 Found ${conversationArray.length} new ModMail conversations`);
    
    for (const conversation of conversationArray) {
      if (conversation.subject?.toLowerCase().includes('recipe')) {
        console.log(`🔍 Processing recipe submission: "${conversation.subject}" from ${conversation.authors?.[0]?.name}`);
        
        const result = await processRecipeSubmission(conversation);
        processedCount++;
        if (conversation.id) {
          processedConversations.push(conversation.id);
        }
        
        if (result.approved) {
          approvedCount++;
        } else {
          rejectedCount++;
        }
      }
    }

    const summary = {
      status: 'success',
      processed: processedCount,
      approved: approvedCount,
      rejected: rejectedCount,
      conversationIds: processedConversations,
      timestamp: new Date().toISOString()
    };

    console.log('✅ ModMail processing complete:', summary);
    res.json(summary);
  } catch (error) {
    console.error('❌ Recipe processing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process recipes',
      error: error instanceof Error ? error.message : 'Unknown error'
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
      service: 'Lemonomics ModMail Processor',
      version: '1.0.0',
      uptime: process.uptime(),
      features: {
        modmail: true,
        flair_awarding: true,
        content_moderation: true,
        recipe_processing: true
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

// Manual trigger for testing ModMail processing (for development)
router.post('/api/test-modmail', async (_req, res): Promise<void> => {
  try {
    console.log('🧪 Manual ModMail test triggered');
    
    // Call the same processing logic
    const testResponse = await fetch('http://localhost:8080/api/process-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await testResponse.json();
    
    res.json({
      status: 'success',
      message: 'Manual test completed',
      result
    });
  } catch (error) {
    console.error('Manual test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Manual test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to process individual recipe submissions
const processRecipeSubmission = async (conversation: any): Promise<{approved: boolean, reason?: string}> => {
  try {
    const messageBody = conversation.messages?.[0]?.body || '';
    const author = conversation.authors?.[0]?.name;
    
    if (!author) {
      console.log('⚠️ No author found for conversation:', conversation.id);
      return { approved: false, reason: 'No author found' };
    }

    // Basic content moderation
    const moderationResult = moderateContent(messageBody);
    
    if (moderationResult.reject) {
      // Auto-reject inappropriate content
      console.log(`❌ Rejecting recipe from ${author}: ${moderationResult.reasons.join(', ')}`);
      
      await reddit.modMail.reply({
        conversationId: conversation.id,
        body: `🍋 Thanks for your recipe submission, ${author}!

Unfortunately, your submission couldn't be approved because:
${moderationResult.reasons.join('\n')}

Please feel free to submit a lemon-themed recipe that follows our community guidelines! We'd love to see your culinary creativity! 🍋✨

**Tips for a great recipe submission:**
• Include ingredients and instructions
• Keep it lemon-themed (lemonade, lemon desserts, etc.)
• Use family-friendly language
• Share what makes your recipe special!`
      });
      
      await reddit.modMail.archiveConversation(conversation.id);
      return { approved: false, reason: moderationResult.reasons.join(', ') };
    } else {
      // Auto-approve and award flair
      console.log(`✅ Approving recipe from ${author}`);
      
      try {
        await reddit.setUserFlair({
          subredditName: 'Lemonomics',
          username: author,
          flairTemplateId: 'd90ca4dc-b51e-11f0-b99e-2a4a16d658e4' // Recipe Contributor flair
        });
        console.log(`🏷️ Awarded Recipe Contributor flair to ${author}`);
      } catch (flairError) {
        console.error(`Failed to award flair to ${author}:`, flairError);
      }

      await reddit.modMail.reply({
        conversationId: conversation.id,
        body: `🎉 Congratulations, ${author}! Your recipe submission has been approved!

You've earned the "Recipe Contributor" flair in r/Lemonomics! This special flair shows that you're part of our creative community of lemon enthusiasts.

**What's next?**
• Your flair will appear next to your username in r/Lemonomics
• Keep playing the Lemonomics game to discover more recipes
• Feel free to share more of your favorite lemon recipes anytime!

Thanks for contributing to our zesty community! 🍋✨🏆`
      });
      
      await reddit.modMail.archiveConversation(conversation.id);
      return { approved: true };
    }
  } catch (error) {
    console.error(`Error processing recipe submission from ${conversation.authors?.[0]?.name}:`, error);
    return { approved: false, reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

// Enhanced content moderation for recipe submissions
const moderateContent = (content: string) => {
  const lowerContent = content.toLowerCase();
  const reasons: string[] = [];
  
  // Check for inappropriate content
  const inappropriateWords = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap',
    'stupid', 'idiot', 'hate', 'kill', 'die', 'death'
  ];
  const hasInappropriateContent = inappropriateWords.some(word => 
    lowerContent.includes(word)
  );
  
  if (hasInappropriateContent) {
    reasons.push('• Contains inappropriate or offensive language');
  }
  
  // Check for spam indicators
  const spamIndicators = [
    'buy now', 'click here', 'free money', 'make money fast',
    'www.', 'http', '.com', 'subscribe', 'follow me'
  ];
  const hasSpamContent = spamIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  if (hasSpamContent) {
    reasons.push('• Appears to contain promotional or spam content');
  }
  
  // Check for minimum content length
  if (content.trim().length < 10) {
    reasons.push('• Submission is too short - please provide more details');
  }
  
  // Check for lemon/recipe relevance
  const lemonKeywords = [
    'lemon', 'citrus', 'lime', 'recipe', 'ingredients', 'cook', 'bake',
    'drink', 'beverage', 'dessert', 'sweet', 'sour', 'juice', 'zest',
    'lemonade', 'cupcake', 'cake', 'pie', 'tart', 'syrup'
  ];
  const hasRelevantContent = lemonKeywords.some(keyword => 
    lowerContent.includes(keyword)
  );
  
  // Only check relevance for longer submissions
  if (!hasRelevantContent && content.length > 50) {
    reasons.push('• Submission doesn\'t appear to be lemon or recipe related');
  }
  
  // Check for recipe structure (ingredients, instructions, etc.)
  const recipeStructure = [
    'ingredient', 'cup', 'tablespoon', 'teaspoon', 'mix', 'add',
    'step', 'instruction', 'serve', 'enjoy', 'taste', 'flavor'
  ];
  const hasRecipeStructure = recipeStructure.some(word => 
    lowerContent.includes(word)
  );
  
  // Bonus points for good recipe structure
  const qualityScore = hasRecipeStructure ? 1 : 0;
  
  return {
    reject: reasons.length > 0,
    reasons,
    qualityScore
  };
};

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

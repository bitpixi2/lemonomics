import express from 'express';
import { context, redis } from '@devvit/web/server';
import { DEFAULT_CONFIG } from '../../shared/types/config.js';
import { LemonadeGameEngine } from '../../shared/engine/GameEngine.js';
import { WeatherType, FLAIR_REWARDS } from '../../shared/types/game.js';

export class APIServer {
  private app: express.Application;
  private gameEngine: LemonadeGameEngine;

  constructor() {
    this.app = express();
    this.gameEngine = new LemonadeGameEngine();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '1mb' }));

    // CORS headers
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-username'
      );

      if (_req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // User context middleware using Devvit context
    this.app.use((req, _res, next) => {
      // Extract user info from Devvit context
      try {
        const { userId, username } = context;
        req.headers['x-user-id'] = userId || 'anonymous';
        req.headers['x-username'] = username || 'anonymous';
      } catch (error) {
        // Fallback for development/testing
        req.headers['x-user-id'] = 'dev-user-123';
        req.headers['x-username'] = 'dev_user';
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Basic health check
    this.app.get('/api/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'lemonomics-api',
      });
    });

    // Game configuration
    this.app.get('/api/config', (_req, res) => {
      res.json({
        success: true,
        config: DEFAULT_CONFIG,
      });
    });

    // Core game endpoints
    this.app.post('/api/start-game', async (req, res) => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const session = await this.gameEngine.startNewGame(userId);

        res.json({
          success: true,
          session: {
            sessionId: session.sessionId,
            day: session.currentDay,
            cash: session.cash,
            inventory: session.inventory,
            weather: this.generateRandomWeather(),
          },
        });
      } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to start game',
        });
      }
    });

    this.app.post('/api/purchase-ingredients', async (req, res) => {
      try {
        const { sessionId, lemons, sugar, cups } = req.body;

        if (
          !sessionId ||
          typeof lemons !== 'number' ||
          typeof sugar !== 'number' ||
          typeof cups !== 'number'
        ) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: sessionId, lemons, sugar, cups',
          });
        }

        const result = this.gameEngine.purchaseIngredients(sessionId, {
          lemons,
          sugar,
          cups,
        });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: result.error,
          });
        }

        res.json({
          success: true,
          newCash: result.newCash,
          newInventory: result.newInventory,
        });
      } catch (error) {
        console.error('Purchase ingredients error:', error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to purchase ingredients',
        });
      }
    });

    this.app.post('/api/end-day', async (req, res) => {
      try {
        const { sessionId, dayInput, weather } = req.body;

        if (!sessionId || !dayInput) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: sessionId, dayInput',
          });
        }

        const dayWeather = weather || this.generateRandomWeather();
        const dayResult = await this.gameEngine.playDay(
          sessionId,
          dayInput,
          dayWeather
        );

        // Check for achievement milestones
        const session = this.gameEngine.getSession(sessionId);
        const achievements = session
          ? this.checkAchievements(session.cash)
          : [];

        res.json({
          success: true,
          dayResult,
          totalCash: session?.cash || 0,
          achievements,
        });
      } catch (error) {
        console.error('End day error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to end day',
        });
      }
    });

    this.app.post('/api/end-game', async (req, res) => {
      try {
        const { sessionId } = req.body;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: sessionId',
          });
        }

        const gameEndResult = await this.gameEngine.endGame(sessionId);

        res.json({
          success: true,
          gameEndResult,
        });
      } catch (error) {
        console.error('End game error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to end game',
        });
      }
    });

    this.app.get('/api/user-profile', (req, res) => {
      res.json({
        success: true,
        message: 'User profile endpoint - to be implemented',
      });
    });

    this.app.get('/api/leaderboard', async (_req, res) => {
      try {
        // Get leaderboard from Redis sorted set
        const leaderboardKey = 'leaderboard:global';
        const topScores = await redis.zRevRangeWithScores(leaderboardKey, 0, 9); // Top 10

        const leaderboard = await Promise.all(
          topScores.map(async (entry, index) => {
            const userKey = `user:${entry.member}`;
            const userData = await redis.hGetAll(userKey);

            return {
              rank: index + 1,
              username: userData.username || entry.member,
              finalCash: entry.score,
              daysPlayed: parseInt(userData.daysPlayed || '0'),
              timestamp: new Date(userData.lastPlayed || Date.now()),
            };
          })
        );

        res.json({
          success: true,
          leaderboard,
        });
      } catch (error) {
        console.error('Leaderboard error:', error);
        // Fallback to mock data if Redis fails
        const mockLeaderboard = [
          {
            rank: 1,
            username: 'LemonadeKing',
            finalCash: 150.0,
            daysPlayed: 12,
            timestamp: new Date(),
          },
          {
            rank: 2,
            username: 'CitrusQueen',
            finalCash: 125.5,
            daysPlayed: 10,
            timestamp: new Date(),
          },
          {
            rank: 3,
            username: 'SugarRush',
            finalCash: 98.25,
            daysPlayed: 8,
            timestamp: new Date(),
          },
        ];

        res.json({
          success: true,
          leaderboard: mockLeaderboard,
        });
      }
    });

    this.app.post('/api/check-achievements', async (req, res) => {
      try {
        const { cash } = req.body;

        if (typeof cash !== 'number') {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: cash (number)',
          });
        }

        const achievements = this.checkAchievements(cash);

        res.json({
          success: true,
          achievements,
        });
      } catch (error) {
        console.error('Check achievements error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to check achievements',
        });
      }
    });

    this.app.post('/api/submit-score', async (req, res) => {
      try {
        const { finalCash, totalDays } = req.body;
        const userId = req.headers['x-user-id'] as string;
        const username = req.headers['x-username'] as string;

        if (typeof finalCash !== 'number' || typeof totalDays !== 'number') {
          return res.status(400).json({
            success: false,
            error:
              'Missing required fields: finalCash (number), totalDays (number)',
          });
        }

        // Save to leaderboard (sorted set by final cash)
        const leaderboardKey = 'leaderboard:global';
        await redis.zAdd(leaderboardKey, { member: userId, score: finalCash });

        // Save user data
        const userKey = `user:${userId}`;
        await redis.hSet(userKey, {
          username,
          finalCash: finalCash.toString(),
          daysPlayed: totalDays.toString(),
          lastPlayed: new Date().toISOString(),
        });

        // Get player's rank
        const rank = await redis.zRevRank(leaderboardKey, userId);
        const playerRank = rank !== null ? rank + 1 : -1;

        res.json({
          success: true,
          message: 'Score submitted successfully',
          rank: playerRank,
        });
      } catch (error) {
        console.error('Submit score error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to submit score',
        });
      }
    });

    this.app.post('/api/assign-flair', async (req, res) => {
      try {
        const { flairTemplateId } = req.body;
        const username = req.headers['x-username'] as string;

        if (!flairTemplateId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: flairTemplateId',
          });
        }

        // Use Devvit context to assign flair
        try {
          const { reddit } = context;
          const subredditName = await reddit.getCurrentSubredditName();

          await reddit.setUserFlair({
            username,
            subredditName,
            flairTemplateId,
          });

          console.log(
            `Assigned flair ${flairTemplateId} to user ${username} in r/${subredditName}`
          );

          res.json({
            success: true,
            message: `Flair assigned to ${username}`,
          });
        } catch (redditError) {
          console.error('Reddit API error:', redditError);
          res.status(500).json({
            success: false,
            error: 'Failed to assign flair via Reddit API',
          });
        }
      } catch (error) {
        console.error('Assign flair error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to assign flair',
        });
      }
    });

    this.app.post('/api/save-game', async (req, res) => {
      try {
        const { sessionId } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: sessionId',
          });
        }

        const session = this.gameEngine.getSession(sessionId);
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        // Save to Redis
        const gameKey = `game:${userId}`;
        await redis.hSet(gameKey, {
          sessionId: session.sessionId,
          currentDay: session.currentDay.toString(),
          cash: session.cash.toString(),
          inventory: JSON.stringify(session.inventory),
          dailyResults: JSON.stringify(session.dailyResults),
          totalDaysPlayed: session.totalDaysPlayed.toString(),
          lastSaved: new Date().toISOString(),
        });

        console.log(
          `Saved game session ${sessionId} for user ${userId} to Redis`
        );

        res.json({
          success: true,
          message: 'Game saved successfully',
        });
      } catch (error) {
        console.error('Save game error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to save game',
        });
      }
    });

    this.app.get('/api/resume-game', async (req, res) => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const gameKey = `game:${userId}`;

        // Check if saved game exists
        const savedGame = await redis.hGetAll(gameKey);

        if (!savedGame || Object.keys(savedGame).length === 0) {
          return res.json({
            success: true,
            hasSavedGame: false,
            message: 'No saved game found',
          });
        }

        res.json({
          success: true,
          hasSavedGame: true,
          savedGame: {
            currentDay: parseInt(savedGame.currentDay || '1'),
            cash: parseFloat(savedGame.cash || '10.00'),
            inventory: JSON.parse(
              savedGame.inventory || '{"lemons":0,"sugar":2,"cups":0}'
            ),
            totalDaysPlayed: parseInt(savedGame.totalDaysPlayed || '0'),
            lastSaved: savedGame.lastSaved,
          },
        });
      } catch (error) {
        console.error('Resume game error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to resume game',
        });
      }
    });

    this.app.post('/api/post-progress', async (req, res) => {
      try {
        const { sessionId, message } = req.body;
        const username = req.headers['x-username'] as string;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: sessionId',
          });
        }

        const session = this.gameEngine.getSession(sessionId);
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        // Create Reddit post
        const progressMessage =
          message ||
          `🍋 ${username} just earned $${session.cash.toFixed(2)} in ${session.totalDaysPlayed} days of lemonade business! #Lemonomics`;

        try {
          const { reddit } = context;
          const subredditName = await reddit.getCurrentSubredditName();

          const post = await reddit.submitPost({
            title: `🍋 Lemonomics Progress Report - ${username}`,
            text: progressMessage,
            subredditName,
          });

          console.log(`Created Reddit post: ${post.id} in r/${subredditName}`);

          res.json({
            success: true,
            message: 'Progress posted successfully',
            postId: post.id,
            postContent: progressMessage,
          });
        } catch (redditError) {
          console.error('Reddit post error:', redditError);
          res.status(500).json({
            success: false,
            error: 'Failed to create Reddit post',
          });
        }
      } catch (error) {
        console.error('Post progress error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to post progress',
        });
      }
    });

    // Devvit internal endpoints for menu actions and triggers
    this.app.post('/internal/menu/create-game-post', async (req, res) => {
      try {
        const { reddit, context } = await import('@devvit/web/server');
        
        if (!context.subredditName) {
          return res.status(400).json({
            success: false,
            error: 'Subreddit name is required',
          });
        }

        const post = await reddit.submitCustomPost({
          subredditName: context.subredditName,
          title: '🍋 Lemonomics - Lemonade Stand Business Game',
          splash: {
            appDisplayName: 'Lemonomics',
            buttonLabel: '🍋 Start Your Business',
            description: 'The classic lemonade stand game! Buy ingredients, serve customers, and build your lemonade empire. Can you become the ultimate lemonade tycoon?',
            entryUri: 'index.html',
            heading: 'Build Your Lemonade Empire!',
          },
          postData: {
            gameType: 'lemonade-stand',
            version: '1.0.0',
          },
        });

        console.log(`Created Lemonomics post: ${post.id} in r/${context.subredditName}`);

        res.json({
          success: true,
          message: 'Game post created successfully',
          postId: post.id,
        });
      } catch (error) {
        console.error('Create game post error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create game post',
        });
      }
    });

    this.app.post('/internal/on-app-install', async (req, res) => {
      try {
        const { reddit, context } = await import('@devvit/web/server');
        
        if (!context.subredditName) {
          return res.status(400).json({
            success: false,
            error: 'Subreddit name is required',
          });
        }

        // Create a welcome post when the app is installed
        const post = await reddit.submitCustomPost({
          subredditName: context.subredditName,
          title: '🍋 Welcome to Lemonomics! Your Lemonade Stand Awaits',
          splash: {
            appDisplayName: 'Lemonomics',
            buttonLabel: '🍋 Play Lemonomics',
            description: 'The classic lemonade stand business simulation is now live! Buy ingredients, manage your stand, and compete with other entrepreneurs.',
            entryUri: 'index.html',
            heading: 'Ready to Start Your Business?',
          },
          postData: {
            gameType: 'lemonade-stand',
            version: '1.0.0',
            isWelcomePost: true,
          },
        });

        console.log(`Created welcome post: ${post.id} in r/${context.subredditName}`);

        res.json({
          success: true,
          message: 'Welcome post created successfully',
          postId: post.id,
        });
      } catch (error) {
        console.error('App install trigger error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create welcome post',
        });
      }
    });

    // Error handling middleware
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error('API Error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    );

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🍋 Lemonomics API server running on port ${port}`);
    });
  }

  /**
   * Generate random weather for a day
   */
  private generateRandomWeather(): WeatherType {
    const weatherTypes = [
      WeatherType.SUNNY,
      WeatherType.WINDY,
      WeatherType.RAINY,
    ];
    const weights = [0.5, 0.3, 0.2]; // 50% sunny, 30% windy, 20% rainy

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weatherTypes.length; i++) {
      cumulative += weights[i] || 0;
      if (random <= cumulative) {
        return weatherTypes[i] || WeatherType.SUNNY;
      }
    }

    return WeatherType.SUNNY; // Fallback
  }

  /**
   * Check for achievement milestones and return earned flairs
   */
  private checkAchievements(
    cash: number
  ): Array<{ templateId: string; name: string; description: string }> {
    const achievements = [];

    for (const reward of FLAIR_REWARDS) {
      if (cash >= reward.cashThreshold) {
        achievements.push({
          templateId: reward.templateId,
          name: reward.name,
          description: reward.description,
        });
      }
    }

    return achievements;
  }
}

import express from 'express';
import { GameRunEndpoint } from './game-run-endpoint.js';
import { ProfileEndpoint } from './profile-endpoint.js';
import { LeaderboardEndpoint } from './leaderboard-endpoint.js';
import { CurrentCycleEndpoint } from './current-cycle-endpoint.js';
import { PaymentEndpoint } from './payment-endpoint.js';
import { BonusEndpoint } from './bonus-endpoint.js';
import { HealthCheckService } from '../monitoring/health-check.js';
import { SystemMonitor } from '../monitoring/system-monitor.js';
import { GameAnalyticsService } from '../monitoring/game-analytics.js';
import { DataMaintenanceService } from '../maintenance/data-maintenance.js';

export class APIServer {
  private app: express.Application;
  private gameRunEndpoint: GameRunEndpoint;
  private profileEndpoint: ProfileEndpoint;
  private leaderboardEndpoint: LeaderboardEndpoint;
  private currentCycleEndpoint: CurrentCycleEndpoint;
  private paymentEndpoint: PaymentEndpoint;
  private bonusEndpoint: BonusEndpoint;
  private healthCheckService: HealthCheckService;
  private systemMonitor: SystemMonitor;
  private analyticsService: GameAnalyticsService;
  private maintenanceService: DataMaintenanceService;

  constructor() {
    this.app = express();
    this.gameRunEndpoint = new GameRunEndpoint();
    this.profileEndpoint = new ProfileEndpoint();
    this.leaderboardEndpoint = new LeaderboardEndpoint();
    this.currentCycleEndpoint = new CurrentCycleEndpoint();
    this.paymentEndpoint = new PaymentEndpoint();
    this.bonusEndpoint = new BonusEndpoint();
    this.healthCheckService = new HealthCheckService();
    this.systemMonitor = new SystemMonitor();
    this.analyticsService = new GameAnalyticsService();
    this.maintenanceService = new DataMaintenanceService();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '1mb' }));

    // CORS headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-username');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // User context middleware (simulated for development)
    this.app.use((req, res, next) => {
      // In production, this would extract user info from Devvit context
      if (!req.headers['x-user-id']) {
        req.headers['x-user-id'] = 'dev-user-123';
      }
      if (!req.headers['x-username']) {
        req.headers['x-username'] = 'dev_user';
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/api/health', async (req, res) => {
      try {
        const health = await this.healthCheckService.basicHealthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    });

    this.app.get('/api/health/detailed', async (req, res) => {
      try {
        const health = await this.healthCheckService.detailedHealthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Detailed health check failed'
        });
      }
    });

    this.app.get('/api/health/ready', async (req, res) => {
      try {
        const readiness = await this.healthCheckService.readinessCheck();
        res.status(readiness.ready ? 200 : 503).json(readiness);
      } catch (error) {
        res.status(503).json({
          ready: false,
          checks: {},
          message: 'Readiness check failed'
        });
      }
    });

    this.app.get('/api/health/live', async (req, res) => {
      try {
        const liveness = await this.healthCheckService.livenessCheck();
        res.status(liveness.alive ? 200 : 503).json(liveness);
      } catch (error) {
        res.status(503).json({
          alive: false,
          checks: {},
          message: 'Liveness check failed'
        });
      }
    });

    this.app.get('/api/health/metrics', async (req, res) => {
      try {
        const metrics = await this.healthCheckService.getPerformanceMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get performance metrics'
        });
      }
    });

    // Game configuration
    this.app.get('/api/config', (req, res) => {
      res.json({
        success: true,
        config: {
          game: {
            minPrice: 0.25,
            maxPrice: 3.00,
            minAdSpend: 0,
            maxAdSpend: 50
          },
          powerups: {
            super_sugar: { price: 0.99, dailyLimit: 3 },
            perfect_day: { price: 1.99, dailyLimit: 1 },
            free_ad: { price: 0.49, dailyLimit: 5 }
          }
        }
      });
    });

    // Game run endpoint
    this.app.post('/api/run-game', (req, res) => {
      this.gameRunEndpoint.handleGameRun(req, res);
    });

    // Profile endpoints
    this.app.get('/api/profile', (req, res) => {
      this.profileEndpoint.handleGetProfile(req, res);
    });

    this.app.put('/api/profile', (req, res) => {
      this.profileEndpoint.handleUpdateProfile(req, res);
    });

    // Leaderboard endpoints
    this.app.get('/api/leaderboards', (req, res) => {
      this.leaderboardEndpoint.handleGetLeaderboards(req, res);
    });

    this.app.get('/api/user-rank', (req, res) => {
      this.leaderboardEndpoint.handleGetUserRank(req, res);
    });

    // Current cycle endpoints
    this.app.get('/api/current-cycle', (req, res) => {
      this.currentCycleEndpoint.handleGetCurrentCycle(req, res);
    });

    this.app.get('/api/cycle-history', (req, res) => {
      this.currentCycleEndpoint.handleGetCycleHistory(req, res);
    });

    // Payment endpoints
    this.app.post('/api/purchase', (req, res) => {
      this.paymentEndpoint.handlePurchase(req, res);
    });

    this.app.get('/api/powerup-status', (req, res) => {
      this.paymentEndpoint.handleGetPowerupStatus(req, res);
    });

    this.app.post('/api/verify-receipt', (req, res) => {
      this.paymentEndpoint.handleVerifyReceipt(req, res);
    });

    // Bonus endpoints
    this.app.post('/api/bonus/claim', (req, res) => {
      this.bonusEndpoint.handleClaimBonus(req, res);
    });

    this.app.get('/api/bonus/status', (req, res) => {
      this.bonusEndpoint.handleGetBonusStatus(req, res);
    });

    this.app.get('/api/bonus/preview', (req, res) => {
      this.bonusEndpoint.handlePreviewBonus(req, res);
    });

    this.app.get('/api/bonus/stats', (req, res) => {
      this.bonusEndpoint.handleGetBonusStats(req, res);
    });

    this.app.get('/api/bonus/check/:bonusType', (req, res) => {
      this.bonusEndpoint.handleCheckActiveBonus(req, res);
    });

    this.app.get('/api/bonus/streak', (req, res) => {
      this.bonusEndpoint.handleGetLoginStreak(req, res);
    });

    this.app.get('/api/bonus/history', (req, res) => {
      this.bonusEndpoint.handleGetBonusHistory(req, res);
    });

    this.app.get('/api/bonus/validate', (req, res) => {
      this.bonusEndpoint.handleValidateBonusClaim(req, res);
    });

    // Analytics endpoints
    this.app.get('/api/analytics', (req, res) => {
      try {
        const { timeframe = 'day' } = req.query;
        const analytics = this.analyticsService.getGameAnalytics(timeframe as 'day' | 'week' | 'month');
        res.json({
          success: true,
          analytics
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get analytics'
        });
      }
    });

    this.app.get('/api/analytics/engagement', (req, res) => {
      try {
        const { timeframe = 'day' } = req.query;
        const engagement = this.analyticsService.getEngagementMetrics(timeframe as 'day' | 'week' | 'month');
        res.json({
          success: true,
          engagement
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get engagement metrics'
        });
      }
    });

    this.app.get('/api/analytics/monetization', (req, res) => {
      try {
        const { timeframe = 'day' } = req.query;
        const monetization = this.analyticsService.getMonetizationMetrics(timeframe as 'day' | 'week' | 'month');
        res.json({
          success: true,
          monetization
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get monetization metrics'
        });
      }
    });

    // Maintenance endpoints
    this.app.get('/api/maintenance/tasks', (req, res) => {
      try {
        const tasks = this.maintenanceService.getTasks();
        res.json({
          success: true,
          tasks
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get maintenance tasks'
        });
      }
    });

    this.app.post('/api/maintenance/run/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const result = await this.maintenanceService.runTask(taskId);
        res.json({
          success: true,
          result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: `Failed to run maintenance task: ${error}`
        });
      }
    });

    this.app.get('/api/maintenance/stats', (req, res) => {
      try {
        const stats = this.maintenanceService.getMaintenanceStats();
        res.json({
          success: true,
          stats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get maintenance stats'
        });
      }
    });

    // Share result endpoint (placeholder)
    this.app.post('/api/share-result', (req, res) => {
      // This would integrate with Reddit post creation
      res.json({
        success: true,
        postUrl: 'https://reddit.com/r/lemonomics_game/posts/shared-result'
      });
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🍋 Karma Lemonade Stand API server running on port ${port}`);
    });
  }
}

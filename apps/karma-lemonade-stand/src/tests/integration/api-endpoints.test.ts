import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { APIServer } from '../../server/api/server.js';

describe('API Endpoints Integration Tests', () => {
  let app: any;
  let server: APIServer;

  beforeEach(() => {
    server = new APIServer();
    app = server.getApp();
  });

  describe('Health Check Endpoints', () => {
    describe('GET /api/health', () => {
      it('should return basic health status', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
        expect(['healthy', 'unhealthy']).toContain(response.body.status);
      });
    });

    describe('GET /api/health/detailed', () => {
      it('should return detailed health information', async () => {
        const response = await request(app)
          .get('/api/health/detailed')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('services');
        expect(response.body).toHaveProperty('metrics');
        expect(response.body).toHaveProperty('alerts');
        
        expect(response.body.services).toHaveProperty('redis');
        expect(response.body.services).toHaveProperty('gameEngine');
        expect(response.body.services).toHaveProperty('leaderboards');
        expect(response.body.services).toHaveProperty('userProfiles');
      });
    });

    describe('GET /api/health/ready', () => {
      it('should return readiness status', async () => {
        const response = await request(app)
          .get('/api/health/ready');

        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('ready');
        expect(response.body).toHaveProperty('checks');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.ready).toBe('boolean');
      });
    });

    describe('GET /api/health/live', () => {
      it('should return liveness status', async () => {
        const response = await request(app)
          .get('/api/health/live');

        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('alive');
        expect(response.body).toHaveProperty('checks');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.alive).toBe('boolean');
      });
    });

    describe('GET /api/health/metrics', () => {
      it('should return performance metrics', async () => {
        const response = await request(app)
          .get('/api/health/metrics')
          .expect(200);

        expect(response.body).toHaveProperty('responseTime');
        expect(response.body).toHaveProperty('throughput');
        expect(response.body).toHaveProperty('resources');
        expect(response.body).toHaveProperty('errors');
        
        expect(response.body.responseTime).toHaveProperty('average');
        expect(response.body.responseTime).toHaveProperty('p95');
        expect(response.body.responseTime).toHaveProperty('p99');
      });
    });
  });

  describe('Game Configuration', () => {
    describe('GET /api/config', () => {
      it('should return game configuration', async () => {
        const response = await request(app)
          .get('/api/config')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('config');
        expect(response.body.config).toHaveProperty('game');
        expect(response.body.config).toHaveProperty('powerups');
        
        expect(response.body.config.game).toHaveProperty('minPrice');
        expect(response.body.config.game).toHaveProperty('maxPrice');
        expect(response.body.config.game).toHaveProperty('minAdSpend');
        expect(response.body.config.game).toHaveProperty('maxAdSpend');
      });
    });
  });

  describe('User Profile Endpoints', () => {
    describe('GET /api/profile', () => {
      it('should return user profile', async () => {
        const response = await request(app)
          .get('/api/profile')
          .set('x-user-id', 'test-user')
          .set('x-username', 'testuser')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('profile');
        expect(response.body).toHaveProperty('progressSummary');
      });

      it('should handle missing user headers', async () => {
        const response = await request(app)
          .get('/api/profile')
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          progress: {
            totalRuns: 10,
            bestProfit: 50.00
          }
        };

        const response = await request(app)
          .put('/api/profile')
          .set('x-user-id', 'test-user')
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('profile');
      });
    });
  });

  describe('Game Run Endpoint', () => {
    describe('POST /api/run-game', () => {
      it('should process valid game run', async () => {
        const gameRun = {
          price: 1.00,
          adSpend: 10,
          powerupReceipts: []
        };

        const response = await request(app)
          .post('/api/run-game')
          .set('x-user-id', 'test-user')
          .send(gameRun)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('result');
        expect(response.body).toHaveProperty('progress');
        expect(response.body).toHaveProperty('updatedProfile');
        expect(response.body).toHaveProperty('rateLimitInfo');
      });

      it('should validate price input', async () => {
        const invalidGameRun = {
          price: -1.00, // Invalid negative price
          adSpend: 10,
          powerupReceipts: []
        };

        const response = await request(app)
          .post('/api/run-game')
          .set('x-user-id', 'test-user')
          .send(invalidGameRun)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid price');
      });

      it('should validate ad spend input', async () => {
        const invalidGameRun = {
          price: 1.00,
          adSpend: -5, // Invalid negative ad spend
          powerupReceipts: []
        };

        const response = await request(app)
          .post('/api/run-game')
          .set('x-user-id', 'test-user')
          .send(invalidGameRun)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid ad spend');
      });

      it('should handle missing user ID', async () => {
        const gameRun = {
          price: 1.00,
          adSpend: 10,
          powerupReceipts: []
        };

        const response = await request(app)
          .post('/api/run-game')
          .send(gameRun)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Leaderboard Endpoints', () => {
    describe('GET /api/leaderboards', () => {
      it('should return leaderboards', async () => {
        const response = await request(app)
          .get('/api/leaderboards')
          .set('x-user-id', 'test-user')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('daily');
        expect(response.body).toHaveProperty('weekly');
        expect(response.body).toHaveProperty('userRanks');
      });

      it('should filter by type', async () => {
        const response = await request(app)
          .get('/api/leaderboards?type=daily')
          .set('x-user-id', 'test-user')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('daily');
        expect(response.body).not.toHaveProperty('weekly');
      });

      it('should limit results', async () => {
        const response = await request(app)
          .get('/api/leaderboards?limit=10')
          .set('x-user-id', 'test-user')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        // Results should be limited (though we can't test exact count without data)
      });
    });

    describe('GET /api/user-rank', () => {
      it('should return user rank', async () => {
        const response = await request(app)
          .get('/api/user-rank')
          .set('x-user-id', 'test-user')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('rank');
        expect(response.body).toHaveProperty('pureRank');
        expect(response.body).toHaveProperty('type');
      });

      it('should handle missing user ID', async () => {
        const response = await request(app)
          .get('/api/user-rank')
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Current Cycle Endpoints', () => {
    describe('GET /api/current-cycle', () => {
      it('should return current cycle information', async () => {
        const response = await request(app)
          .get('/api/current-cycle')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('daily');
        expect(response.body).toHaveProperty('weekly');
      });

      it('should filter by type', async () => {
        const response = await request(app)
          .get('/api/current-cycle?type=daily')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('daily');
        expect(response.body).not.toHaveProperty('weekly');
      });
    });

    describe('GET /api/cycle-history', () => {
      it('should return cycle history', async () => {
        const response = await request(app)
          .get('/api/cycle-history')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('history');
        expect(response.body).toHaveProperty('type');
        expect(Array.isArray(response.body.history)).toBe(true);
      });

      it('should limit history days', async () => {
        const response = await request(app)
          .get('/api/cycle-history?days=3')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('history');
      });
    });
  });

  describe('Payment Endpoints', () => {
    describe('POST /api/purchase', () => {
      it('should process valid purchase', async () => {
        const purchase = {
          sku: 'super_sugar',
          quantity: 1
        };

        const response = await request(app)
          .post('/api/purchase')
          .set('x-user-id', 'test-user')
          .send(purchase)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('receiptId');
        expect(response.body).toHaveProperty('powerupStatus');
      });

      it('should validate SKU', async () => {
        const invalidPurchase = {
          sku: 'invalid-sku',
          quantity: 1
        };

        const response = await request(app)
          .post('/api/purchase')
          .set('x-user-id', 'test-user')
          .send(invalidPurchase)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });

      it('should require user ID', async () => {
        const purchase = {
          sku: 'super_sugar',
          quantity: 1
        };

        const response = await request(app)
          .post('/api/purchase')
          .send(purchase)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/powerup-status', () => {
      it('should return powerup status', async () => {
        const response = await request(app)
          .get('/api/powerup-status')
          .set('x-user-id', 'test-user')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('powerups');
      });
    });

    describe('POST /api/verify-receipt', () => {
      it('should verify receipt', async () => {
        const receiptData = {
          receiptId: 'test-receipt-123'
        };

        const response = await request(app)
          .post('/api/verify-receipt')
          .send(receiptData)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        // Receipt verification will fail in test environment, but endpoint should respond
      });

      it('should require receipt ID', async () => {
        const response = await request(app)
          .post('/api/verify-receipt')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Analytics Endpoints', () => {
    describe('GET /api/analytics', () => {
      it('should return game analytics', async () => {
        const response = await request(app)
          .get('/api/analytics')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('analytics');
        expect(response.body.analytics).toHaveProperty('totalGames');
        expect(response.body.analytics).toHaveProperty('uniquePlayers');
        expect(response.body.analytics).toHaveProperty('averageProfit');
      });

      it('should filter by timeframe', async () => {
        const response = await request(app)
          .get('/api/analytics?timeframe=week')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('analytics');
      });
    });

    describe('GET /api/analytics/engagement', () => {
      it('should return engagement metrics', async () => {
        const response = await request(app)
          .get('/api/analytics/engagement')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('engagement');
        expect(response.body.engagement).toHaveProperty('dailyActiveUsers');
        expect(response.body.engagement).toHaveProperty('averageSessionLength');
      });
    });

    describe('GET /api/analytics/monetization', () => {
      it('should return monetization metrics', async () => {
        const response = await request(app)
          .get('/api/analytics/monetization')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('monetization');
        expect(response.body.monetization).toHaveProperty('totalRevenue');
        expect(response.body.monetization).toHaveProperty('conversionRate');
      });
    });
  });

  describe('Maintenance Endpoints', () => {
    describe('GET /api/maintenance/tasks', () => {
      it('should return maintenance tasks', async () => {
        const response = await request(app)
          .get('/api/maintenance/tasks')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('tasks');
        expect(Array.isArray(response.body.tasks)).toBe(true);
      });
    });

    describe('GET /api/maintenance/stats', () => {
      it('should return maintenance statistics', async () => {
        const response = await request(app)
          .get('/api/maintenance/stats')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('stats');
        expect(response.body.stats).toHaveProperty('totalTasks');
        expect(response.body.stats).toHaveProperty('completedTasks');
      });
    });

    describe('POST /api/maintenance/run/:taskId', () => {
      it('should run maintenance task', async () => {
        const response = await request(app)
          .post('/api/maintenance/run/cleanup-old-leaderboard-entries')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('result');
      });

      it('should handle invalid task ID', async () => {
        const response = await request(app)
          .post('/api/maintenance/run/invalid-task-id')
          .expect(500);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .expect(200);
    });
  });
});

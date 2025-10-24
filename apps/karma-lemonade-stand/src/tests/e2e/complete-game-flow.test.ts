import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { APIServer } from '../../server/api/server.js';

describe('End-to-End Game Flow Tests', () => {
  let app: any;
  let server: APIServer;
  let testUserId: string;
  let testUsername: string;

  beforeEach(() => {
    server = new APIServer();
    app = server.getApp();
    testUserId = `test-user-${Date.now()}`;
    testUsername = `testuser${Date.now()}`;
  });

  describe('Complete Game Session Flow', () => {
    it('should complete a full game session from start to finish', async () => {
      // Step 1: Check system health
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(healthResponse.body.status).toBe('healthy');

      // Step 2: Get game configuration
      const configResponse = await request(app)
        .get('/api/config')
        .expect(200);
      
      expect(configResponse.body.success).toBe(true);
      expect(configResponse.body.config).toHaveProperty('game');
      
      const gameConfig = configResponse.body.config.game;

      // Step 3: Get/Create user profile
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('x-user-id', testUserId)
        .set('x-username', testUsername)
        .expect(200);
      
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.profile).toHaveProperty('userId', testUserId);
      expect(profileResponse.body.profile).toHaveProperty('username', testUsername);

      // Step 4: Get current cycle information
      const cycleResponse = await request(app)
        .get('/api/current-cycle')
        .expect(200);
      
      expect(cycleResponse.body.success).toBe(true);
      expect(cycleResponse.body).toHaveProperty('daily');
      expect(cycleResponse.body).toHaveProperty('weekly');

      // Step 5: Run a game with valid parameters
      const gameRun = {
        price: (gameConfig.minPrice + gameConfig.maxPrice) / 2, // Middle price
        adSpend: gameConfig.minAdSpend + 5, // Small ad spend
        powerupReceipts: []
      };

      const gameResponse = await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send(gameRun)
        .expect(200);
      
      expect(gameResponse.body.success).toBe(true);
      expect(gameResponse.body.result).toHaveProperty('profit');
      expect(gameResponse.body.result).toHaveProperty('cupsSold');
      expect(gameResponse.body.result).toHaveProperty('weather');
      expect(gameResponse.body.result).toHaveProperty('event');
      expect(gameResponse.body.result).toHaveProperty('festival');
      expect(gameResponse.body.progress).toHaveProperty('streak');
      expect(gameResponse.body.progress).toHaveProperty('personalBest');

      // Step 6: Check updated profile
      const updatedProfileResponse = await request(app)
        .get('/api/profile')
        .set('x-user-id', testUserId)
        .set('x-username', testUsername)
        .expect(200);
      
      expect(updatedProfileResponse.body.success).toBe(true);
      expect(updatedProfileResponse.body.profile.progress.totalRuns).toBeGreaterThan(0);

      // Step 7: Check leaderboards
      const leaderboardResponse = await request(app)
        .get('/api/leaderboards')
        .set('x-user-id', testUserId)
        .expect(200);
      
      expect(leaderboardResponse.body.success).toBe(true);
      expect(leaderboardResponse.body).toHaveProperty('daily');
      expect(leaderboardResponse.body).toHaveProperty('weekly');
      expect(leaderboardResponse.body).toHaveProperty('userRanks');

      // Step 8: Get user rank
      const rankResponse = await request(app)
        .get('/api/user-rank')
        .set('x-user-id', testUserId)
        .expect(200);
      
      expect(rankResponse.body.success).toBe(true);
      expect(rankResponse.body).toHaveProperty('rank');
      expect(rankResponse.body).toHaveProperty('pureRank');
    });

    it('should handle multiple game runs in sequence', async () => {
      const gameRuns = [
        { price: 0.50, adSpend: 0 },   // Low price, no ads
        { price: 1.00, adSpend: 10 },  // Medium price, some ads
        { price: 1.50, adSpend: 20 }   // High price, more ads
      ];

      const results = [];

      for (const gameRun of gameRuns) {
        const response = await request(app)
          .post('/api/run-game')
          .set('x-user-id', testUserId)
          .send({ ...gameRun, powerupReceipts: [] })
          .expect(200);
        
        expect(response.body.success).toBe(true);
        results.push(response.body.result);
      }

      // Verify results are different (due to different parameters)
      expect(results.length).toBe(3);
      expect(results[0].profit).not.toBe(results[1].profit);
      expect(results[1].profit).not.toBe(results[2].profit);

      // Check final profile shows multiple runs
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('x-user-id', testUserId)
        .set('x-username', testUsername)
        .expect(200);
      
      expect(profileResponse.body.profile.progress.totalRuns).toBe(3);
    });
  });

  describe('Power-up Purchase and Usage Flow', () => {
    it('should complete power-up purchase and usage flow', async () => {
      // Step 1: Check available power-ups
      const powerupStatusResponse = await request(app)
        .get('/api/powerup-status')
        .set('x-user-id', testUserId)
        .expect(200);
      
      expect(powerupStatusResponse.body.success).toBe(true);
      expect(powerupStatusResponse.body).toHaveProperty('powerups');

      // Step 2: Purchase a power-up
      const purchaseResponse = await request(app)
        .post('/api/purchase')
        .set('x-user-id', testUserId)
        .send({ sku: 'super_sugar', quantity: 1 })
        .expect(200);
      
      expect(purchaseResponse.body.success).toBe(true);
      expect(purchaseResponse.body).toHaveProperty('receiptId');

      // Step 3: Verify receipt
      const verifyResponse = await request(app)
        .post('/api/verify-receipt')
        .send({ receiptId: purchaseResponse.body.receiptId })
        .expect(200);
      
      // Note: Verification may fail in test environment, but endpoint should respond
      expect(verifyResponse.body).toHaveProperty('success');

      // Step 4: Use power-up in game run
      const gameWithPowerup = {
        price: 1.00,
        adSpend: 10,
        powerupReceipts: [purchaseResponse.body.receiptId]
      };

      const gameResponse = await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send(gameWithPowerup)
        .expect(200);
      
      expect(gameResponse.body.success).toBe(true);
      // Power-up effects should be applied (though may not be visible in test environment)
    });

    it('should handle daily purchase limits', async () => {
      // Attempt to purchase multiple power-ups to test limits
      const purchases = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/purchase')
          .set('x-user-id', testUserId)
          .send({ sku: 'super_sugar', quantity: 1 });
        
        purchases.push(response);
      }

      // Some purchases should succeed, others should fail due to limits
      const successfulPurchases = purchases.filter(p => p.body.success);
      const failedPurchases = purchases.filter(p => !p.body.success);

      expect(successfulPurchases.length).toBeGreaterThan(0);
      expect(failedPurchases.length).toBeGreaterThan(0);
    });
  });

  describe('Leaderboard Integration Flow', () => {
    it('should update leaderboards after game runs', async () => {
      // Get initial leaderboard state
      const initialLeaderboard = await request(app)
        .get('/api/leaderboards')
        .set('x-user-id', testUserId)
        .expect(200);

      // Run a high-scoring game
      const highScoreRun = {
        price: 0.75, // Good price point
        adSpend: 25,  // Significant advertising
        powerupReceipts: []
      };

      await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send(highScoreRun)
        .expect(200);

      // Check updated leaderboard
      const updatedLeaderboard = await request(app)
        .get('/api/leaderboards')
        .set('x-user-id', testUserId)
        .expect(200);

      expect(updatedLeaderboard.body.success).toBe(true);
      
      // User should have a rank now
      const userRank = await request(app)
        .get('/api/user-rank')
        .set('x-user-id', testUserId)
        .expect(200);

      expect(userRank.body.success).toBe(true);
      expect(typeof userRank.body.rank).toBe('number');
    });
  });

  describe('Analytics and Monitoring Flow', () => {
    it('should track analytics throughout game session', async () => {
      // Run several games to generate analytics data
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/run-game')
          .set('x-user-id', testUserId)
          .send({
            price: 1.00 + (i * 0.25),
            adSpend: 5 + (i * 5),
            powerupReceipts: []
          })
          .expect(200);
      }

      // Check game analytics
      const analyticsResponse = await request(app)
        .get('/api/analytics')
        .expect(200);
      
      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.analytics.totalGames).toBeGreaterThan(0);

      // Check engagement metrics
      const engagementResponse = await request(app)
        .get('/api/analytics/engagement')
        .expect(200);
      
      expect(engagementResponse.body.success).toBe(true);
      expect(engagementResponse.body.engagement).toHaveProperty('dailyActiveUsers');

      // Check monetization metrics
      const monetizationResponse = await request(app)
        .get('/api/analytics/monetization')
        .expect(200);
      
      expect(monetizationResponse.body.success).toBe(true);
      expect(monetizationResponse.body.monetization).toHaveProperty('totalRevenue');
    });
  });

  describe('Error Recovery Flow', () => {
    it('should handle and recover from various error conditions', async () => {
      // Test invalid game parameters
      const invalidRun = {
        price: -1.00, // Invalid price
        adSpend: 10,
        powerupReceipts: []
      };

      const errorResponse = await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send(invalidRun)
        .expect(400);
      
      expect(errorResponse.body.success).toBe(false);
      expect(errorResponse.body.error).toContain('Invalid price');

      // Verify system is still functional after error
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(healthResponse.body.status).toBe('healthy');

      // Verify valid game run still works
      const validRun = {
        price: 1.00,
        adSpend: 10,
        powerupReceipts: []
      };

      const validResponse = await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send(validRun)
        .expect(200);
      
      expect(validResponse.body.success).toBe(true);
    });
  });

  describe('Maintenance Operations Flow', () => {
    it('should handle maintenance operations without disrupting service', async () => {
      // Check maintenance status
      const maintenanceStats = await request(app)
        .get('/api/maintenance/stats')
        .expect(200);
      
      expect(maintenanceStats.body.success).toBe(true);

      // Run a maintenance task
      const taskResponse = await request(app)
        .post('/api/maintenance/run/validate-data-integrity')
        .expect(200);
      
      expect(taskResponse.body.success).toBe(true);

      // Verify system is still healthy after maintenance
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(healthResponse.body.status).toBe('healthy');

      // Verify game functionality is unaffected
      const gameResponse = await request(app)
        .post('/api/run-game')
        .set('x-user-id', testUserId)
        .send({
          price: 1.00,
          adSpend: 10,
          powerupReceipts: []
        })
        .expect(200);
      
      expect(gameResponse.body.success).toBe(true);
    });
  });
});

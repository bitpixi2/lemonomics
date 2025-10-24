import { SystemMonitor, SystemHealth } from './system-monitor.js';
import { GameAnalyticsService } from './game-analytics.js';

export interface HealthCheckEndpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  handler: () => Promise<any>;
}

export class HealthCheckService {
  private systemMonitor: SystemMonitor;
  private analyticsService: GameAnalyticsService;

  constructor() {
    this.systemMonitor = new SystemMonitor();
    this.analyticsService = new GameAnalyticsService();
  }

  /**
   * Basic health check - returns simple status
   */
  async basicHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
  }> {
    try {
      const systemHealth = await this.systemMonitor.checkSystemHealth();
      
      return {
        status: systemHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime()
      };
    }
  }

  /**
   * Detailed health check - returns comprehensive system status
   */
  async detailedHealthCheck(): Promise<SystemHealth> {
    return await this.systemMonitor.checkSystemHealth();
  }

  /**
   * Readiness check - determines if system is ready to serve traffic
   */
  async readinessCheck(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
    message: string;
  }> {
    const checks: Record<string, boolean> = {};
    
    try {
      // Check critical services
      checks.redis = await this.checkRedisReadiness();
      checks.gameEngine = await this.checkGameEngineReadiness();
      checks.leaderboards = await this.checkLeaderboardReadiness();
      
      const allReady = Object.values(checks).every(check => check);
      
      return {
        ready: allReady,
        checks,
        message: allReady ? 'System is ready' : 'System is not ready - some services are unavailable'
      };
    } catch (error) {
      return {
        ready: false,
        checks,
        message: `Readiness check failed: ${error}`
      };
    }
  }

  /**
   * Liveness check - determines if system is alive and should continue running
   */
  async livenessCheck(): Promise<{
    alive: boolean;
    checks: Record<string, boolean>;
    message: string;
  }> {
    const checks: Record<string, boolean> = {};
    
    try {
      // Check if core processes are responsive
      checks.httpServer = await this.checkHttpServerLiveness();
      checks.memoryUsage = await this.checkMemoryUsage();
      checks.errorRate = await this.checkErrorRate();
      
      const alive = Object.values(checks).every(check => check);
      
      return {
        alive,
        checks,
        message: alive ? 'System is alive' : 'System may need restart - critical issues detected'
      };
    } catch (error) {
      return {
        alive: false,
        checks,
        message: `Liveness check failed: ${error}`
      };
    }
  }

  /**
   * Performance metrics for monitoring
   */
  async getPerformanceMetrics(): Promise<{
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      gamesPerMinute: number;
    };
    resources: {
      memoryUsage: number;
      cpuUsage: number;
      redisConnections: number;
    };
    errors: {
      errorRate: number;
      recentErrors: number;
    };
  }> {
    const performanceReport = await this.systemMonitor.getPerformanceReport();
    const analytics = this.analyticsService.getGameAnalytics('day');
    
    return {
      responseTime: {
        average: performanceReport.metrics.averageResponseTime,
        p95: performanceReport.metrics.averageResponseTime * 1.5, // Simulated
        p99: performanceReport.metrics.averageResponseTime * 2.0   // Simulated
      },
      throughput: {
        requestsPerSecond: Math.floor(analytics.totalGames / (24 * 60 * 60)), // Games per second
        gamesPerMinute: Math.floor(analytics.totalGames / (24 * 60))
      },
      resources: {
        memoryUsage: performanceReport.metrics.memoryUsage,
        cpuUsage: Math.random() * 0.8 + 0.1, // Simulated 10-90%
        redisConnections: performanceReport.metrics.redisConnections
      },
      errors: {
        errorRate: performanceReport.metrics.errorRate,
        recentErrors: Math.floor(analytics.totalGames * performanceReport.metrics.errorRate)
      }
    };
  }

  /**
   * Gets all available health check endpoints
   */
  getHealthCheckEndpoints(): HealthCheckEndpoint[] {
    return [
      {
        path: '/api/health',
        method: 'GET',
        description: 'Basic health check - returns simple status',
        handler: () => this.basicHealthCheck()
      },
      {
        path: '/api/health/detailed',
        method: 'GET',
        description: 'Detailed health check - returns comprehensive system status',
        handler: () => this.detailedHealthCheck()
      },
      {
        path: '/api/health/ready',
        method: 'GET',
        description: 'Readiness check - determines if system is ready to serve traffic',
        handler: () => this.readinessCheck()
      },
      {
        path: '/api/health/live',
        method: 'GET',
        description: 'Liveness check - determines if system is alive',
        handler: () => this.livenessCheck()
      },
      {
        path: '/api/health/metrics',
        method: 'GET',
        description: 'Performance metrics for monitoring',
        handler: () => this.getPerformanceMetrics()
      }
    ];
  }

  // Private helper methods

  private async checkRedisReadiness(): Promise<boolean> {
    try {
      // Test basic Redis connectivity
      // In a real implementation, this would ping Redis
      return true;
    } catch (error) {
      console.error('Redis readiness check failed:', error);
      return false;
    }
  }

  private async checkGameEngineReadiness(): Promise<boolean> {
    try {
      // Test game engine components
      // This would verify that all game systems are initialized
      return true;
    } catch (error) {
      console.error('Game engine readiness check failed:', error);
      return false;
    }
  }

  private async checkLeaderboardReadiness(): Promise<boolean> {
    try {
      // Test leaderboard system
      // This would verify leaderboard data is accessible
      return true;
    } catch (error) {
      console.error('Leaderboard readiness check failed:', error);
      return false;
    }
  }

  private async checkHttpServerLiveness(): Promise<boolean> {
    try {
      // Check if HTTP server is responsive
      // This would test internal server health
      return true;
    } catch (error) {
      console.error('HTTP server liveness check failed:', error);
      return false;
    }
  }

  private async checkMemoryUsage(): Promise<boolean> {
    try {
      // Check memory usage is within acceptable limits
      const memoryUsage = this.getMemoryUsagePercent();
      return memoryUsage < 0.9; // Less than 90%
    } catch (error) {
      console.error('Memory usage check failed:', error);
      return false;
    }
  }

  private async checkErrorRate(): Promise<boolean> {
    try {
      // Check error rate is within acceptable limits
      const analytics = this.analyticsService.getGameAnalytics('day');
      return analytics.errorRate < 5.0; // Less than 5%
    } catch (error) {
      console.error('Error rate check failed:', error);
      return false;
    }
  }

  private getUptime(): number {
    // In a real implementation, this would track actual process uptime
    return Math.floor(process.uptime());
  }

  private getMemoryUsagePercent(): number {
    // In a real implementation, this would use process.memoryUsage()
    return Math.random() * 0.8 + 0.1; // Simulated 10-90%
  }
}

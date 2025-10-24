import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';
import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter.js';
import { ConfigAdapter } from '../../shared/redis/config-adapter.js';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    redis: ServiceStatus;
    gameEngine: ServiceStatus;
    leaderboards: ServiceStatus;
    userProfiles: ServiceStatus;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
  uptime: number;
}

export interface SystemMetrics {
  activeUsers: number;
  gamesPlayedToday: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  redisConnections: number;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  service: string;
  resolved: boolean;
}

export class SystemMonitor {
  private userAdapter: UserProfileAdapter;
  private leaderboardAdapter: LeaderboardAdapter;
  private configAdapter: ConfigAdapter;
  private alerts: Alert[] = [];
  private metrics: SystemMetrics;
  private startTime: Date;

  constructor() {
    this.userAdapter = {} as UserProfileAdapter;
    this.leaderboardAdapter = {} as LeaderboardAdapter;
    this.configAdapter = {} as ConfigAdapter;
    this.startTime = new Date();
    this.metrics = {
      activeUsers: 0,
      gamesPlayedToday: 0,
      averageResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      redisConnections: 0
    };
  }

  /**
   * Performs comprehensive system health check
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date();
    
    // Check individual services
    const [redis, gameEngine, leaderboards, userProfiles] = await Promise.all([
      this.checkRedisHealth(),
      this.checkGameEngineHealth(),
      this.checkLeaderboardHealth(),
      this.checkUserProfileHealth()
    ]);

    // Update metrics
    await this.updateMetrics();

    // Determine overall system status
    const services = { redis, gameEngine, leaderboards, userProfiles };
    const status = this.determineOverallStatus(services);

    // Check for new alerts
    await this.checkForAlerts(services);

    return {
      status,
      timestamp,
      services,
      metrics: this.metrics,
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Checks Redis connectivity and performance
   */
  private async checkRedisHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    let status: 'up' | 'down' | 'degraded' = 'up';
    let errorCount = 0;

    try {
      // Test basic Redis operations
      await this.testRedisOperations();
      
      const responseTime = Date.now() - startTime;
      
      // Consider degraded if response time is high
      if (responseTime > 1000) {
        status = 'degraded';
        this.addAlert('warning', 'Redis response time is high', 'redis');
      }

      return {
        status,
        responseTime,
        lastCheck: new Date(),
        errorCount,
        uptime: this.getUptime()
      };

    } catch (error) {
      errorCount++;
      this.addAlert('error', `Redis health check failed: ${error}`, 'redis');
      
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount,
        uptime: this.getUptime()
      };
    }
  }

  /**
   * Tests basic Redis operations
   */
  private async testRedisOperations(): Promise<void> {
    // Test configuration access
    try {
      await this.configAdapter.getConfig();
    } catch (error) {
      throw new Error(`Config access failed: ${error}`);
    }

    // Test user profile operations
    try {
      await this.userAdapter.getProfile('health-check-user');
    } catch (error) {
      throw new Error(`User profile access failed: ${error}`);
    }

    // Test leaderboard operations
    try {
      await this.leaderboardAdapter.getDailyLeaderboard();
    } catch (error) {
      throw new Error(`Leaderboard access failed: ${error}`);
    }
  }

  /**
   * Checks game engine health
   */
  private async checkGameEngineHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      // Test game engine components
      await this.testGameEngineComponents();
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 0,
        uptime: this.getUptime()
      };

    } catch (error) {
      this.addAlert('error', `Game engine health check failed: ${error}`, 'gameEngine');
      
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 1,
        uptime: this.getUptime()
      };
    }
  }

  /**
   * Tests game engine components
   */
  private async testGameEngineComponents(): Promise<void> {
    // Test cycle managers
    // Test profit calculator
    // Test demand calculator
    // Test seed generator
    
    // For now, just simulate the checks
    console.log('Testing game engine components...');
  }

  /**
   * Checks leaderboard system health
   */
  private async checkLeaderboardHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      // Test leaderboard operations
      const dailyLeaderboard = await this.leaderboardAdapter.getDailyLeaderboard();
      const weeklyLeaderboard = await this.leaderboardAdapter.getWeeklyLeaderboard();
      
      // Check leaderboard integrity
      if (!dailyLeaderboard || !weeklyLeaderboard) {
        throw new Error('Leaderboard data is missing');
      }

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 0,
        uptime: this.getUptime()
      };

    } catch (error) {
      this.addAlert('error', `Leaderboard health check failed: ${error}`, 'leaderboards');
      
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 1,
        uptime: this.getUptime()
      };
    }
  }

  /**
   * Checks user profile system health
   */
  private async checkUserProfileHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      // Test user profile operations
      // This would test profile creation, updates, etc.
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 0,
        uptime: this.getUptime()
      };

    } catch (error) {
      this.addAlert('error', `User profile health check failed: ${error}`, 'userProfiles');
      
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 1,
        uptime: this.getUptime()
      };
    }
  }

  /**
   * Updates system metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Get active user count (would query Redis for recent activity)
      this.metrics.activeUsers = await this.getActiveUserCount();
      
      // Get games played today
      this.metrics.gamesPlayedToday = await this.getGamesPlayedToday();
      
      // Calculate average response time
      this.metrics.averageResponseTime = await this.calculateAverageResponseTime();
      
      // Calculate error rate
      this.metrics.errorRate = await this.calculateErrorRate();
      
      // Get memory usage (would use process.memoryUsage() in Node.js)
      this.metrics.memoryUsage = this.getMemoryUsage();
      
      // Get Redis connection count
      this.metrics.redisConnections = await this.getRedisConnectionCount();

    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  /**
   * Determines overall system status based on service statuses
   */
  private determineOverallStatus(services: SystemHealth['services']): SystemHealth['status'] {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('down')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Checks for system alerts based on service status and metrics
   */
  private async checkForAlerts(services: SystemHealth['services']): Promise<void> {
    // Check service-specific alerts
    Object.entries(services).forEach(([serviceName, service]) => {
      if (service.status === 'down') {
        this.addAlert('critical', `${serviceName} service is down`, serviceName);
      } else if (service.status === 'degraded') {
        this.addAlert('warning', `${serviceName} service is degraded`, serviceName);
      }
      
      if (service.responseTime > 2000) {
        this.addAlert('warning', `${serviceName} response time is high (${service.responseTime}ms)`, serviceName);
      }
    });

    // Check metric-based alerts
    if (this.metrics.errorRate > 0.05) { // 5% error rate
      this.addAlert('warning', `High error rate: ${(this.metrics.errorRate * 100).toFixed(2)}%`, 'system');
    }

    if (this.metrics.memoryUsage > 0.9) { // 90% memory usage
      this.addAlert('critical', `High memory usage: ${(this.metrics.memoryUsage * 100).toFixed(2)}%`, 'system');
    }

    if (this.metrics.averageResponseTime > 1000) {
      this.addAlert('warning', `High average response time: ${this.metrics.averageResponseTime}ms`, 'system');
    }
  }

  /**
   * Adds a new alert
   */
  private addAlert(level: Alert['level'], message: string, service: string): void {
    const alertId = `${service}-${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.service === service && 
      alert.message === message && 
      !alert.resolved
    );

    if (!existingAlert) {
      const alert: Alert = {
        id: alertId,
        level,
        message,
        timestamp: new Date(),
        service,
        resolved: false
      };

      this.alerts.push(alert);
      console.log(`[ALERT ${level.toUpperCase()}] ${service}: ${message}`);
    }
  }

  /**
   * Gets active (unresolved) alerts
   */
  private getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolves an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Gets system uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Gets active user count (placeholder implementation)
   */
  private async getActiveUserCount(): Promise<number> {
    // Would query Redis for users active in last 24 hours
    return Math.floor(Math.random() * 1000) + 100;
  }

  /**
   * Gets games played today count (placeholder implementation)
   */
  private async getGamesPlayedToday(): Promise<number> {
    // Would query game run logs or leaderboard entries
    return Math.floor(Math.random() * 5000) + 500;
  }

  /**
   * Calculates average response time (placeholder implementation)
   */
  private async calculateAverageResponseTime(): Promise<number> {
    // Would calculate from recent API response times
    return Math.floor(Math.random() * 500) + 100;
  }

  /**
   * Calculates error rate (placeholder implementation)
   */
  private async calculateErrorRate(): Promise<number> {
    // Would calculate from error logs
    return Math.random() * 0.1; // 0-10% error rate
  }

  /**
   * Gets memory usage percentage (placeholder implementation)
   */
  private getMemoryUsage(): number {
    // Would use process.memoryUsage() in Node.js
    return Math.random() * 0.8 + 0.1; // 10-90% memory usage
  }

  /**
   * Gets Redis connection count (placeholder implementation)
   */
  private async getRedisConnectionCount(): Promise<number> {
    // Would query Redis connection info
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Gets system performance report
   */
  async getPerformanceReport(): Promise<{
    uptime: number;
    metrics: SystemMetrics;
    trends: {
      userGrowth: number;
      gameActivity: number;
      errorTrend: number;
    };
  }> {
    return {
      uptime: this.getUptime(),
      metrics: this.metrics,
      trends: {
        userGrowth: Math.random() * 0.2 - 0.1, // -10% to +10%
        gameActivity: Math.random() * 0.3 - 0.1, // -10% to +20%
        errorTrend: Math.random() * 0.1 - 0.05 // -5% to +5%
      }
    };
  }
}

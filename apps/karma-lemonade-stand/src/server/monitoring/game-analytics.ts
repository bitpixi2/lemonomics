export interface GameEvent {
  id: string;
  userId: string;
  eventType: GameEventType;
  timestamp: Date;
  data: Record<string, any>;
  sessionId?: string;
}

export enum GameEventType {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  POWERUP_PURCHASE = 'powerup_purchase',
  POWERUP_USE = 'powerup_use',
  LEADERBOARD_VIEW = 'leaderboard_view',
  PROFILE_VIEW = 'profile_view',
  SHARE_RESULT = 'share_result',
  ERROR_OCCURRED = 'error_occurred',
  PAYMENT_FAILED = 'payment_failed',
  RATE_LIMITED = 'rate_limited'
}

export interface GameAnalytics {
  totalGames: number;
  uniquePlayers: number;
  averageProfit: number;
  topProfit: number;
  powerupUsage: Record<string, number>;
  errorRate: number;
  retentionRate: number;
  conversionRate: number;
}

export interface PlayerBehavior {
  userId: string;
  gamesPlayed: number;
  totalProfit: number;
  averageProfit: number;
  powerupsUsed: number;
  lastActive: Date;
  streakDays: number;
  preferredPlayTime: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

export class GameAnalyticsService {
  private events: GameEvent[] = [];
  private playerBehaviors: Map<string, PlayerBehavior> = new Map();

  /**
   * Logs a game event
   */
  logEvent(userId: string, eventType: GameEventType, data: Record<string, any> = {}): void {
    const event: GameEvent = {
      id: this.generateEventId(),
      userId,
      eventType,
      timestamp: new Date(),
      data,
      sessionId: this.getSessionId(userId)
    };

    this.events.push(event);
    this.updatePlayerBehavior(userId, event);

    // Log to console for development
    console.log(`[ANALYTICS] ${eventType}: ${userId}`, data);
  }

  /**
   * Logs a game run completion
   */
  logGameRun(userId: string, gameData: {
    profit: number;
    cupsSold: number;
    price: number;
    adSpend: number;
    powerupsUsed: string[];
    weather: string;
    event: string;
    festival: string;
    duration: number;
  }): void {
    this.logEvent(userId, GameEventType.GAME_END, gameData);
  }

  /**
   * Logs a power-up purchase
   */
  logPowerupPurchase(userId: string, sku: string, price: number, success: boolean): void {
    this.logEvent(userId, GameEventType.POWERUP_PURCHASE, {
      sku,
      price,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logs an error occurrence
   */
  logError(userId: string, error: string, context: Record<string, any> = {}): void {
    this.logEvent(userId, GameEventType.ERROR_OCCURRED, {
      error,
      context,
      userAgent: 'unknown', // Would get from request headers
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets comprehensive game analytics
   */
  getGameAnalytics(timeframe: 'day' | 'week' | 'month' = 'day'): GameAnalytics {
    const cutoffDate = this.getCutoffDate(timeframe);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffDate);
    
    const gameEndEvents = recentEvents.filter(event => event.eventType === GameEventType.GAME_END);
    const uniquePlayers = new Set(gameEndEvents.map(event => event.userId)).size;
    
    const profits = gameEndEvents.map(event => event.data.profit || 0);
    const totalProfit = profits.reduce((sum, profit) => sum + profit, 0);
    const averageProfit = profits.length > 0 ? totalProfit / profits.length : 0;
    const topProfit = profits.length > 0 ? Math.max(...profits) : 0;

    // Calculate power-up usage
    const powerupUsage: Record<string, number> = {};
    gameEndEvents.forEach(event => {
      const powerupsUsed = event.data.powerupsUsed || [];
      powerupsUsed.forEach((powerup: string) => {
        powerupUsage[powerup] = (powerupUsage[powerup] || 0) + 1;
      });
    });

    // Calculate error rate
    const errorEvents = recentEvents.filter(event => event.eventType === GameEventType.ERROR_OCCURRED);
    const errorRate = recentEvents.length > 0 ? errorEvents.length / recentEvents.length : 0;

    // Calculate retention rate (simplified)
    const retentionRate = this.calculateRetentionRate(timeframe);

    // Calculate conversion rate (power-up purchases vs games played)
    const purchaseEvents = recentEvents.filter(event => event.eventType === GameEventType.POWERUP_PURCHASE);
    const conversionRate = gameEndEvents.length > 0 ? purchaseEvents.length / gameEndEvents.length : 0;

    return {
      totalGames: gameEndEvents.length,
      uniquePlayers,
      averageProfit: Math.round(averageProfit * 100) / 100,
      topProfit: Math.round(topProfit * 100) / 100,
      powerupUsage,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
      retentionRate: Math.round(retentionRate * 10000) / 100,
      conversionRate: Math.round(conversionRate * 10000) / 100
    };
  }

  /**
   * Gets player behavior analysis
   */
  getPlayerBehavior(userId: string): PlayerBehavior | null {
    return this.playerBehaviors.get(userId) || null;
  }

  /**
   * Gets top players by various metrics
   */
  getTopPlayers(metric: 'profit' | 'games' | 'powerups' = 'profit', limit: number = 10): PlayerBehavior[] {
    const players = Array.from(this.playerBehaviors.values());
    
    players.sort((a, b) => {
      switch (metric) {
        case 'profit':
          return b.totalProfit - a.totalProfit;
        case 'games':
          return b.gamesPlayed - a.gamesPlayed;
        case 'powerups':
          return b.powerupsUsed - a.powerupsUsed;
        default:
          return 0;
      }
    });

    return players.slice(0, limit);
  }

  /**
   * Gets engagement metrics
   */
  getEngagementMetrics(timeframe: 'day' | 'week' | 'month' = 'day'): {
    dailyActiveUsers: number;
    averageSessionLength: number;
    averageGamesPerSession: number;
    bounceRate: number;
    peakHours: number[];
  } {
    const cutoffDate = this.getCutoffDate(timeframe);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffDate);
    
    // Daily active users
    const dailyActiveUsers = new Set(recentEvents.map(event => event.userId)).size;

    // Session analysis
    const sessions = this.analyzeSessions(recentEvents);
    const sessionLengths = sessions.map(session => session.duration);
    const averageSessionLength = sessionLengths.length > 0 
      ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length 
      : 0;

    const gamesPerSession = sessions.map(session => session.gameCount);
    const averageGamesPerSession = gamesPerSession.length > 0
      ? gamesPerSession.reduce((sum, count) => sum + count, 0) / gamesPerSession.length
      : 0;

    // Bounce rate (sessions with only 1 game)
    const bounceSessions = sessions.filter(session => session.gameCount === 1);
    const bounceRate = sessions.length > 0 ? bounceSessions.length / sessions.length : 0;

    // Peak hours analysis
    const hourCounts: Record<number, number> = {};
    recentEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      dailyActiveUsers,
      averageSessionLength: Math.round(averageSessionLength),
      averageGamesPerSession: Math.round(averageGamesPerSession * 100) / 100,
      bounceRate: Math.round(bounceRate * 10000) / 100,
      peakHours
    };
  }

  /**
   * Gets monetization metrics
   */
  getMonetizationMetrics(timeframe: 'day' | 'week' | 'month' = 'day'): {
    totalRevenue: number;
    averageRevenuePerUser: number;
    payingUsers: number;
    conversionRate: number;
    powerupPopularity: Record<string, { purchases: number; revenue: number }>;
  } {
    const cutoffDate = this.getCutoffDate(timeframe);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffDate);
    
    const purchaseEvents = recentEvents.filter(event => 
      event.eventType === GameEventType.POWERUP_PURCHASE && event.data.success
    );

    const totalRevenue = purchaseEvents.reduce((sum, event) => sum + (event.data.price || 0), 0);
    const payingUsers = new Set(purchaseEvents.map(event => event.userId)).size;
    const totalUsers = new Set(recentEvents.map(event => event.userId)).size;
    
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const conversionRate = totalUsers > 0 ? payingUsers / totalUsers : 0;

    // Power-up popularity
    const powerupPopularity: Record<string, { purchases: number; revenue: number }> = {};
    purchaseEvents.forEach(event => {
      const sku = event.data.sku;
      const price = event.data.price || 0;
      
      if (!powerupPopularity[sku]) {
        powerupPopularity[sku] = { purchases: 0, revenue: 0 };
      }
      
      powerupPopularity[sku].purchases++;
      powerupPopularity[sku].revenue += price;
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      payingUsers,
      conversionRate: Math.round(conversionRate * 10000) / 100,
      powerupPopularity
    };
  }

  /**
   * Generates anomaly detection report
   */
  detectAnomalies(): {
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: Date;
    }>;
  } {
    const anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: Date;
    }> = [];

    // Check for unusual error spikes
    const recentErrors = this.events.filter(event => 
      event.eventType === GameEventType.ERROR_OCCURRED &&
      event.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentErrors.length > 10) {
      anomalies.push({
        type: 'error_spike',
        description: `High error rate detected: ${recentErrors.length} errors in the last hour`,
        severity: 'high',
        timestamp: new Date()
      });
    }

    // Check for unusual payment failures
    const recentPaymentFailures = this.events.filter(event =>
      event.eventType === GameEventType.PAYMENT_FAILED &&
      event.timestamp >= new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentPaymentFailures.length > 5) {
      anomalies.push({
        type: 'payment_failures',
        description: `High payment failure rate: ${recentPaymentFailures.length} failures in the last hour`,
        severity: 'medium',
        timestamp: new Date()
      });
    }

    // Check for rate limiting spikes
    const recentRateLimits = this.events.filter(event =>
      event.eventType === GameEventType.RATE_LIMITED &&
      event.timestamp >= new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentRateLimits.length > 20) {
      anomalies.push({
        type: 'rate_limit_spike',
        description: `High rate limiting activity: ${recentRateLimits.length} rate limits in the last hour`,
        severity: 'medium',
        timestamp: new Date()
      });
    }

    return { anomalies };
  }

  /**
   * Exports analytics data for external analysis
   */
  exportData(timeframe: 'day' | 'week' | 'month' = 'day'): {
    events: GameEvent[];
    analytics: GameAnalytics;
    engagement: ReturnType<typeof this.getEngagementMetrics>;
    monetization: ReturnType<typeof this.getMonetizationMetrics>;
  } {
    const cutoffDate = this.getCutoffDate(timeframe);
    const events = this.events.filter(event => event.timestamp >= cutoffDate);

    return {
      events,
      analytics: this.getGameAnalytics(timeframe),
      engagement: this.getEngagementMetrics(timeframe),
      monetization: this.getMonetizationMetrics(timeframe)
    };
  }

  /**
   * Clears old analytics data
   */
  cleanup(daysToKeep: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
    
    console.log(`Analytics cleanup: removed events older than ${daysToKeep} days`);
  }

  // Private helper methods

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(userId: string): string {
    // Simple session ID based on user and hour
    const hour = new Date().getHours();
    return `${userId}_${new Date().toDateString()}_${hour}`;
  }

  private updatePlayerBehavior(userId: string, event: GameEvent): void {
    let behavior = this.playerBehaviors.get(userId);
    
    if (!behavior) {
      behavior = {
        userId,
        gamesPlayed: 0,
        totalProfit: 0,
        averageProfit: 0,
        powerupsUsed: 0,
        lastActive: new Date(),
        streakDays: 0,
        preferredPlayTime: '12:00',
        riskProfile: 'moderate'
      };
    }

    behavior.lastActive = event.timestamp;

    if (event.eventType === GameEventType.GAME_END) {
      behavior.gamesPlayed++;
      const profit = event.data.profit || 0;
      behavior.totalProfit += profit;
      behavior.averageProfit = behavior.totalProfit / behavior.gamesPlayed;
      
      // Update risk profile based on pricing strategy
      const price = event.data.price || 0;
      if (price > 2.0) {
        behavior.riskProfile = 'aggressive';
      } else if (price < 0.5) {
        behavior.riskProfile = 'conservative';
      }
    }

    if (event.eventType === GameEventType.POWERUP_USE) {
      behavior.powerupsUsed++;
    }

    this.playerBehaviors.set(userId, behavior);
  }

  private getCutoffDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private calculateRetentionRate(timeframe: 'day' | 'week' | 'month'): number {
    // Simplified retention calculation
    // In a real implementation, this would compare user activity across periods
    return Math.random() * 0.3 + 0.4; // 40-70% retention rate
  }

  private analyzeSessions(events: GameEvent[]): Array<{
    sessionId: string;
    userId: string;
    duration: number;
    gameCount: number;
  }> {
    const sessions: Record<string, {
      sessionId: string;
      userId: string;
      startTime: Date;
      endTime: Date;
      gameCount: number;
    }> = {};

    events.forEach(event => {
      const sessionId = event.sessionId || this.getSessionId(event.userId);
      
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          sessionId,
          userId: event.userId,
          startTime: event.timestamp,
          endTime: event.timestamp,
          gameCount: 0
        };
      }

      const session = sessions[sessionId];
      if (event.timestamp < session.startTime) {
        session.startTime = event.timestamp;
      }
      if (event.timestamp > session.endTime) {
        session.endTime = event.timestamp;
      }

      if (event.eventType === GameEventType.GAME_END) {
        session.gameCount++;
      }
    });

    return Object.values(sessions).map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      duration: session.endTime.getTime() - session.startTime.getTime(),
      gameCount: session.gameCount
    }));
  }
}

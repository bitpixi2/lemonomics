// Main game engine for Lemonomics
import { GameEngine, GameSession, DayInput, DayResult, GameEndResult, WeatherType, FestivalTheme, KarmaBoost, LeaderboardEntry } from '../types/game.js';
import { GameSessionManager } from './GameSession.js';
import { SalesCalculator } from './SalesCalculator.js';

export class LemonadeGameEngine implements GameEngine {
  private sessionManager: GameSessionManager;
  private salesCalculator: SalesCalculator;

  constructor() {
    this.sessionManager = new GameSessionManager();
    this.salesCalculator = new SalesCalculator();
  }

  /**
   * Start a new game session
   */
  async startNewGame(userId: string): Promise<GameSession> {
    const session = this.sessionManager.createSession(userId);
    
    // Clean up old sessions periodically
    if (Math.random() < 0.1) { // 10% chance
      this.sessionManager.cleanupInactiveSessions();
    }

    return session;
  }

  /**
   * Play a single day
   */
  async playDay(
    sessionId: string, 
    dayInput: DayInput,
    weather?: WeatherType,
    festival?: FestivalTheme,
    karmaBoost?: KarmaBoost
  ): Promise<DayResult> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Game session ${sessionId} not found`);
    }

    if (!session.isActive) {
      throw new Error(`Game session ${sessionId} is not active`);
    }

    // Use provided values or generate random ones
    const dayWeather = weather ?? this.generateRandomWeather();
    const dayFestival = festival ?? FestivalTheme.SUMMER;
    const dayKarmaBoost = karmaBoost ?? { multiplier: 1.0, level: 'none', description: 'No bonus', threshold: 0 };

    // Validate that we can make the requested lemonade
    const cupsToMake = Math.min(dayInput.lemons, dayInput.sugar, dayInput.cups);
    const canMake = this.sessionManager.canMakeLemonade(sessionId, cupsToMake);
    if (!canMake.canMake) {
      throw new Error(canMake.error || 'Cannot make lemonade with current ingredients');
    }

    // Calculate sales for the day
    const dayResult = this.salesCalculator.calculateDaySales(
      dayInput,
      session.inventory,
      dayWeather,
      dayFestival,
      dayKarmaBoost,
      session.currentDay
    );

    // Update the session with the day's results
    this.sessionManager.updateSession(sessionId, dayResult);

    return dayResult;
  }

  /**
   * End a game session and calculate final results
   */
  async endGame(sessionId: string): Promise<GameEndResult> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Game session ${sessionId} not found`);
    }

    // End the session
    const finalSession = this.sessionManager.endSession(sessionId);
    if (!finalSession) {
      throw new Error(`Failed to end session ${sessionId}`);
    }

    // Calculate final results
    const finalCash = finalSession.cash;
    const totalDays = finalSession.totalDaysPlayed;

    // Return real leaderboard data (will be fetched from API)
    return {
      finalCash,
      totalDays,
      leaderboardPosition: 1, // Will be calculated by the API
      leaderboard: [] // Will be populated by the API call
    };
  }

  /**
   * Get current session state
   */
  getSession(sessionId: string): GameSession | null {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * Purchase ingredients for a session
   */
  purchaseIngredients(sessionId: string, purchase: { lemons: number; sugar: number; cups: number }) {
    return this.sessionManager.purchaseIngredients(sessionId, purchase);
  }

  /**
   * Validate ingredient purchase
   */
  validateIngredientPurchase(sessionId: string, purchase: { lemons: number; sugar: number; cups: number }) {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      return { isValid: false, error: 'Session not found', totalCost: 0 };
    }
    return this.sessionManager.validateIngredientPurchase(session, purchase);
  }

  /**
   * Get optimal pricing suggestion
   */
  getOptimalPricing(weather: WeatherType, karmaBoost: KarmaBoost) {
    return this.salesCalculator.getOptimalPricing(weather, karmaBoost);
  }

  /**
   * Calculate demand for given conditions
   */
  calculateDemand(weather: WeatherType, festival: FestivalTheme, karmaBoost: KarmaBoost, pricePerCup: number, day: number) {
    return this.salesCalculator.calculateDemand(weather, festival, karmaBoost, pricePerCup, day);
  }

  /**
   * Get ingredient costs
   */
  static getIngredientCosts() {
    return GameSessionManager.getIngredientCosts();
  }

  /**
   * Generate random weather for a day
   */
  private generateRandomWeather(): WeatherType {
    const weatherTypes = [WeatherType.SUNNY, WeatherType.WINDY, WeatherType.RAINY];
    const weights = [0.5, 0.3, 0.2]; // 50% sunny, 30% windy, 20% rainy
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weatherTypes.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return weatherTypes[i];
      }
    }
    
    return WeatherType.SUNNY; // Fallback
  }

  /**
   * Generate random karma boost based on typical Reddit karma ranges
   */
  generateKarmaBoost(karma: number): KarmaBoost {
    if (karma >= 10000) {
      return {
        multiplier: 1.3,
        level: 'gold',
        description: 'High karma attracts 30% more customers',
        threshold: 10000
      };
    } else if (karma >= 5000) {
      return {
        multiplier: 1.2,
        level: 'silver',
        description: 'Good karma attracts 20% more customers',
        threshold: 5000
      };
    } else if (karma >= 1000) {
      return {
        multiplier: 1.1,
        level: 'bronze',
        description: 'Some karma attracts 10% more customers',
        threshold: 1000
      };
    } else {
      return {
        multiplier: 1.0,
        level: 'none',
        description: 'No karma bonus',
        threshold: 0
      };
    }
  }

  /**
   * Simulate a complete day for testing
   */
  async simulateDay(
    sessionId: string,
    ingredientPurchase: { lemons: number; sugar: number; cups: number },
    pricePerCup: number,
    weather?: WeatherType
  ): Promise<{ purchaseResult: any; dayResult: DayResult }> {
    // First, purchase ingredients
    const purchaseResult = this.purchaseIngredients(sessionId, ingredientPurchase);
    
    if (!purchaseResult.success) {
      throw new Error(purchaseResult.error ?? 'Failed to purchase ingredients');
    }

    // Then play the day
    const dayInput: DayInput = {
      lemons: ingredientPurchase.lemons,
      sugar: ingredientPurchase.sugar,
      cups: ingredientPurchase.cups,
      pricePerCup
    };

    const dayResult = await this.playDay(sessionId, dayInput, weather ?? this.generateRandomWeather());

    return { purchaseResult, dayResult };
  }
}

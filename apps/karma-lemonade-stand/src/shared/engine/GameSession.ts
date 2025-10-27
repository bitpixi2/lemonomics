// Game session management for Lemonomics
import { GameState, GameSession, DayResult, WeatherType, FestivalTheme, KarmaBoost } from '../types/game.js';

export class GameSessionManager {
  private sessions: Map<string, GameSession> = new Map();

  /**
   * Create a new game session
   */
  createSession(userId: string): GameSession {
    const sessionId = this.generateSessionId();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const session: GameSession = {
      userId,
      sessionId,
      startTime: new Date(),
      currentDay: 1,
      cash: 10.00, // Starting cash from mom
      inventory: {
        lemons: 0,
        sugar: 2, // Free sugar from mom
        cups: 0
      },
      dailyResults: [],
      isActive: true,
      totalDaysPlayed: 0,
      lastPlayedRealDate: '', // No previous play date for new session
      canPlayToday: true, // New players can always play their first day
      nextPlayDate: today // Can play today
    };

    this.sessions.set(sessionId, session);
    console.log(`Created new game session ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Get an active session
   */
  getSession(sessionId: string): GameSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session after a day is played
   */
  updateSession(sessionId: string, dayResult: DayResult): GameSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update session with day results
    session.currentDay = dayResult.day + 1;
    session.cash += dayResult.profit;
    session.totalDaysPlayed++;
    session.dailyResults.push(dayResult);

    // Update inventory (subtract used ingredients)
    session.inventory.lemons = Math.max(0, session.inventory.lemons - dayResult.ingredientsPurchased.lemons);
    session.inventory.sugar = Math.max(0, session.inventory.sugar - dayResult.ingredientsPurchased.sugar);
    session.inventory.cups = Math.max(0, session.inventory.cups - dayResult.ingredientsPurchased.cups);

    console.log(`Updated session ${sessionId}: Day ${session.currentDay}, Cash: $${session.cash.toFixed(2)}`);
    return session;
  }

  /**
   * End a game session
   */
  endSession(sessionId: string): GameSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.isActive = false;
    console.log(`Ended session ${sessionId} with final cash: $${session.cash.toFixed(2)}`);
    return session;
  }

  /**
   * Validate ingredient purchase
   */
  validateIngredientPurchase(session: GameSession, purchase: {
    lemons: number;
    sugar: number;
    cups: number;
  }): { isValid: boolean; error?: string; totalCost: number } {
    // Ingredient costs (in dollars)
    const COSTS = {
      lemons: 0.50, // $0.50 per lemon
      sugar: 0.25,  // $0.25 per cup of sugar
      cups: 0.10    // $0.10 per cup
    };

    // Validate quantities are non-negative integers
    if (purchase.lemons < 0 || purchase.sugar < 0 || purchase.cups < 0) {
      return { isValid: false, error: 'Ingredient quantities cannot be negative', totalCost: 0 };
    }

    if (!Number.isInteger(purchase.lemons) || !Number.isInteger(purchase.sugar) || !Number.isInteger(purchase.cups)) {
      return { isValid: false, error: 'Ingredient quantities must be whole numbers', totalCost: 0 };
    }

    // Calculate total cost
    const totalCost = (purchase.lemons * COSTS.lemons) + 
                     (purchase.sugar * COSTS.sugar) + 
                     (purchase.cups * COSTS.cups);

    // Check if player has enough cash
    if (totalCost > session.cash) {
      return { 
        isValid: false, 
        error: `Not enough cash. Need $${totalCost.toFixed(2)}, have $${session.cash.toFixed(2)}`, 
        totalCost 
      };
    }

    return { isValid: true, totalCost };
  }

  /**
   * Process ingredient purchase
   */
  purchaseIngredients(sessionId: string, purchase: {
    lemons: number;
    sugar: number;
    cups: number;
  }): { success: boolean; error?: string; newCash?: number; newInventory?: GameSession['inventory'] } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const validation = this.validateIngredientPurchase(session, purchase);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Validation failed' };
    }

    // Update session
    session.cash -= validation.totalCost;
    session.inventory.lemons += purchase.lemons;
    session.inventory.sugar += purchase.sugar;
    session.inventory.cups += purchase.cups;

    console.log(`Purchased ingredients for session ${sessionId}: ${JSON.stringify(purchase)}, Cost: $${validation.totalCost.toFixed(2)}`);

    return {
      success: true,
      newCash: session.cash,
      newInventory: { ...session.inventory }
    };
  }

  /**
   * Get current game state from session
   */
  getGameState(sessionId: string, weather: WeatherType, festival: FestivalTheme, karmaBoost: KarmaBoost): GameState | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      day: session.currentDay,
      cash: session.cash,
      inventory: { ...session.inventory },
      weather,
      festival,
      karmaBoost,
      isFirstDay: session.currentDay === 1
    };
  }

  /**
   * Check if session can make lemonade
   */
  canMakeLemonade(sessionId: string, cupsToMake: number): { canMake: boolean; maxCups: number; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { canMake: false, maxCups: 0, error: 'Session not found' };
    }

    // Each cup needs: 1 lemon, 1 sugar, 1 cup
    const maxCupsByLemons = session.inventory.lemons;
    const maxCupsBySugar = session.inventory.sugar;
    const maxCupsByCups = session.inventory.cups;
    const maxCups = Math.min(maxCupsByLemons, maxCupsBySugar, maxCupsByCups);

    if (cupsToMake > maxCups) {
      const missing = [];
      if (session.inventory.lemons < cupsToMake) missing.push(`${cupsToMake - session.inventory.lemons} lemons`);
      if (session.inventory.sugar < cupsToMake) missing.push(`${cupsToMake - session.inventory.sugar} sugar`);
      if (session.inventory.cups < cupsToMake) missing.push(`${cupsToMake - session.inventory.cups} cups`);
      
      return { 
        canMake: false, 
        maxCups, 
        error: `Not enough ingredients. Missing: ${missing.join(', ')}` 
      };
    }

    return { canMake: true, maxCups };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get ingredient costs for UI display
   */
  static getIngredientCosts() {
    return {
      lemons: 0.50,
      sugar: 0.25,
      cups: 0.10
    };
  }

  /**
   * Check if a player can play today (real-day restriction)
   */
  canPlayToday(sessionId: string, username?: string): { canPlay: boolean; nextPlayDate?: string; hoursUntilNext?: number; isDeveloper?: boolean } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { canPlay: false };
    }

    // Developer bypass for u/bitpixi - can always play for testing
    const isDeveloper = username === 'bitpixi' || username === 'u/bitpixi';
    if (isDeveloper) {
      return { canPlay: true, isDeveloper: true };
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If they haven't played today, they can play
    if (session.lastPlayedRealDate !== today) {
      return { canPlay: true };
    }

    // They already played today, calculate when they can play next
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Calculate hours until tomorrow
    const now = new Date();
    const tomorrowMidnight = new Date(tomorrow);
    tomorrowMidnight.setHours(0, 0, 0, 0);
    const hoursUntilNext = Math.ceil((tomorrowMidnight.getTime() - now.getTime()) / (1000 * 60 * 60));

    return { 
      canPlay: false, 
      nextPlayDate: tomorrowStr,
      hoursUntilNext 
    };
  }

  /**
   * Update session to mark that a day was played today
   */
  markDayPlayed(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    session.lastPlayedRealDate = today;
    session.canPlayToday = false;
    session.nextPlayDate = tomorrowStr;
  }

  /**
   * Clean up inactive sessions (for memory management)
   */
  cleanupInactiveSessions(): number {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive || session.startTime < cutoffTime) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} inactive sessions`);
    }

    return cleaned;
  }
}

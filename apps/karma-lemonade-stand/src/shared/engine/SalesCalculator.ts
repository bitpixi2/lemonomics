// Sales calculation engine for Lemonomics
import { WeatherType, FestivalTheme, KarmaBoost, DemandCalculation, ProfitCalculation, DayInput, DayResult } from '../types/game.js';

export class SalesCalculator {
  
  /**
   * Calculate customer demand based on various factors
   */
  calculateDemand(
    weather: WeatherType,
    festival: FestivalTheme,
    karmaBoost: KarmaBoost,
    pricePerCup: number,
    day: number
  ): DemandCalculation {
    // Base customer demand (varies by day to add progression)
    const baseCustomers = this.getBaseCustomers(day);
    
    // Weather affects demand significantly
    const weatherMultiplier = this.getWeatherMultiplier(weather);
    
    // Karma boost affects customer attraction
    const karmaMultiplier = karmaBoost.multiplier;
    
    // Price elasticity - higher prices reduce demand
    const priceElasticity = this.calculatePriceElasticity(pricePerCup);
    
    // Festival can boost demand
    const festivalMultiplier = this.getFestivalMultiplier(festival);
    
    // Calculate final demand
    const finalDemand = Math.round(
      baseCustomers * 
      weatherMultiplier * 
      karmaMultiplier * 
      priceElasticity * 
      festivalMultiplier
    );

    return {
      baseCustomers,
      weatherMultiplier,
      karmaMultiplier,
      priceElasticity,
      finalDemand: Math.max(0, finalDemand) // Never negative
    };
  }

  /**
   * Calculate sales results for a day
   */
  calculateDaySales(
    dayInput: DayInput,
    availableIngredients: { lemons: number; sugar: number; cups: number },
    weather: WeatherType,
    festival: FestivalTheme,
    karmaBoost: KarmaBoost,
    day: number
  ): DayResult {
    // Calculate demand
    const demand = this.calculateDemand(weather, festival, karmaBoost, dayInput.pricePerCup, day);
    
    // Calculate maximum cups we can make with available ingredients
    const maxCupsFromIngredients = Math.min(
      availableIngredients.lemons,
      availableIngredients.sugar,
      availableIngredients.cups
    );
    
    // Calculate maximum cups we can make with purchased ingredients
    const maxCupsFromPurchased = Math.min(
      dayInput.lemons,
      dayInput.sugar,
      dayInput.cups
    );
    
    // Total cups we can make
    const maxCupsTotal = maxCupsFromIngredients + maxCupsFromPurchased;
    
    // Actual cups sold is limited by both demand and supply
    const cupsSold = Math.min(demand.finalDemand, maxCupsTotal);
    
    // Calculate revenue
    const revenue = cupsSold * dayInput.pricePerCup;
    
    // Calculate costs (only for ingredients actually used)
    const costs = this.calculateIngredientCosts(dayInput);
    
    // Calculate profit
    const profit = revenue - costs;
    
    // Generate customer dialogue based on performance
    const salesPerformance = this.getSalesPerformance(cupsSold, demand.finalDemand);
    const customerDialogue = this.generateCustomerDialogue(weather, festival, salesPerformance, day);

    return {
      day,
      cupsSold,
      revenue,
      costs,
      profit,
      weather,
      festival,
      customerDialogue,
      pricePerCup: dayInput.pricePerCup,
      ingredientsPurchased: {
        lemons: dayInput.lemons,
        sugar: dayInput.sugar,
        cups: dayInput.cups
      }
    };
  }

  /**
   * Calculate detailed profit breakdown
   */
  calculateProfitBreakdown(dayInput: DayInput, cupsSold: number): ProfitCalculation {
    const costs = this.getIngredientCosts();
    
    const breakdown = {
      cupsSold,
      pricePerCup: dayInput.pricePerCup,
      lemonCost: dayInput.lemons * costs.lemons,
      sugarCost: dayInput.sugar * costs.sugar,
      cupCost: dayInput.cups * costs.cups
    };

    const revenue = cupsSold * dayInput.pricePerCup;
    const ingredientCosts = breakdown.lemonCost + breakdown.sugarCost + breakdown.cupCost;
    const profit = revenue - ingredientCosts;

    return {
      revenue,
      ingredientCosts,
      profit,
      breakdown
    };
  }

  /**
   * Get base customer count based on day (progression system)
   */
  private getBaseCustomers(day: number): number {
    // Start with 15-25 customers, gradually increase
    const baseMin = 15;
    const baseMax = 25;
    const dayBonus = Math.floor((day - 1) / 3) * 2; // +2 customers every 3 days
    
    return baseMin + Math.random() * (baseMax - baseMin) + dayBonus;
  }

  /**
   * Get weather multiplier for demand
   */
  private getWeatherMultiplier(weather: WeatherType): number {
    switch (weather) {
      case WeatherType.SUNNY:
        return 1.5; // 50% more customers on sunny days
      case WeatherType.WINDY:
        return 1.0; // Normal demand on windy days
      case WeatherType.RAINY:
        return 0.6; // 40% fewer customers on rainy days
      default:
        return 1.0;
    }
  }

  /**
   * Calculate price elasticity effect on demand
   */
  private calculatePriceElasticity(pricePerCup: number): number {
    // Optimal price is around $0.50-$0.75
    // Demand drops significantly above $1.00
    if (pricePerCup <= 0.25) return 0.8; // Too cheap, customers suspicious
    if (pricePerCup <= 0.50) return 1.0; // Good price
    if (pricePerCup <= 0.75) return 0.95; // Still reasonable
    if (pricePerCup <= 1.00) return 0.8; // Getting expensive
    if (pricePerCup <= 1.25) return 0.6; // Too expensive
    return 0.4; // Way too expensive
  }

  /**
   * Get festival multiplier for demand
   */
  private getFestivalMultiplier(festival: FestivalTheme): number {
    switch (festival) {
      case FestivalTheme.SUMMER:
        return 1.0; // Normal summer demand
      case FestivalTheme.FESTIVAL:
        return 1.3; // 30% boost during festivals
      case FestivalTheme.CHRISTMAS:
        return 0.8; // Slightly less demand in winter
      case FestivalTheme.HALLOWEEN:
        return 1.1; // Small boost for Halloween
      case FestivalTheme.MEDIEVAL:
        return 1.2; // Novelty boost for medieval theme
      default:
        return 1.0;
    }
  }

  /**
   * Calculate ingredient costs
   */
  private calculateIngredientCosts(dayInput: DayInput): number {
    const costs = this.getIngredientCosts();
    return (dayInput.lemons * costs.lemons) + 
           (dayInput.sugar * costs.sugar) + 
           (dayInput.cups * costs.cups);
  }

  /**
   * Get ingredient costs
   */
  private getIngredientCosts() {
    return {
      lemons: 0.50,
      sugar: 0.25,
      cups: 0.10
    };
  }

  /**
   * Determine sales performance category
   */
  private getSalesPerformance(cupsSold: number, demand: number): 'good' | 'average' | 'poor' {
    const ratio = cupsSold / Math.max(demand, 1);
    if (ratio >= 0.8) return 'good';
    if (ratio >= 0.5) return 'average';
    return 'poor';
  }

  /**
   * Generate customer dialogue based on performance
   */
  private generateCustomerDialogue(
    weather: WeatherType,
    _festival: FestivalTheme,
    performance: 'good' | 'average' | 'poor',
    day: number
  ): string[] {
    const dialogues = {
      good: {
        [WeatherType.SUNNY]: [
          "This lemonade is perfect for such a sunny day!",
          "Best lemonade stand in the neighborhood!",
          "I'll tell my friends about this place!"
        ],
        [WeatherType.WINDY]: [
          "Even with this wind, this hits the spot!",
          "Great lemonade, just what I needed!",
          "You're doing great business!"
        ],
        [WeatherType.RAINY]: [
          "Worth getting wet for this lemonade!",
          "A bright spot on a rainy day!",
          "This warms me up despite the rain!"
        ]
      },
      average: {
        [WeatherType.SUNNY]: [
          "Not bad, could use a bit more sugar though.",
          "It's okay, I've had better.",
          "Decent lemonade for the price."
        ],
        [WeatherType.WINDY]: [
          "It's alright, nothing special.",
          "Could be more refreshing on a windy day.",
          "Fair price for fair lemonade."
        ],
        [WeatherType.RAINY]: [
          "At least it's something warm to drink.",
          "Better than nothing on a day like this.",
          "Could be better, but it'll do."
        ]
      },
      poor: {
        [WeatherType.SUNNY]: [
          "This is way too expensive!",
          "I expected better for this price.",
          "Maybe I'll try somewhere else next time."
        ],
        [WeatherType.WINDY]: [
          "Not worth the money, especially in this wind.",
          "I'm not impressed.",
          "You might want to reconsider your recipe."
        ],
        [WeatherType.RAINY]: [
          "Even desperate, this isn't worth it.",
          "I should have stayed inside.",
          "This doesn't help with the gloomy weather."
        ]
      }
    };

    const performanceDialogues = dialogues[performance];
    const weatherDialogues = performanceDialogues[weather];
    const randomIndex = Math.floor(Math.random() * weatherDialogues.length);
    
    // Add day-specific comments occasionally
    const dayComments: string[] = [];
    if (day === 1) {
      dayComments.push("New lemonade stand? Good luck!");
    } else if (day > 5) {
      dayComments.push("You've been here a while now!");
    }

    const result: string[] = [weatherDialogues[randomIndex]];
    if (dayComments.length > 0 && Math.random() < 0.3) {
      result.push(dayComments[0]);
    }

    return result;
  }

  /**
   * Calculate optimal pricing suggestion
   */
  getOptimalPricing(weather: WeatherType, karmaBoost: KarmaBoost): {
    suggested: number;
    min: number;
    max: number;
    reasoning: string;
  } {
    let base = 0.50;
    
    // Adjust for weather
    if (weather === WeatherType.SUNNY) {
      base += 0.10; // Can charge more on sunny days
    } else if (weather === WeatherType.RAINY) {
      base -= 0.05; // Should charge less on rainy days
    }
    
    // Adjust for karma boost
    if (karmaBoost.level !== 'none') {
      base += 0.05; // Higher karma allows slightly higher prices
    }

    const suggested = Math.round(base * 100) / 100; // Round to cents
    const min = Math.max(0.25, suggested - 0.15);
    const max = suggested + 0.25;

    let reasoning = `Based on ${weather} weather`;
    if (karmaBoost.level !== 'none') {
      reasoning += ` and your ${karmaBoost.level} karma boost`;
    }

    return { suggested, min, max, reasoning };
  }
}

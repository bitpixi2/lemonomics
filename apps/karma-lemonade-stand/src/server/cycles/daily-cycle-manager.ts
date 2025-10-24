import { WeatherType, MarketEvent, DailyCycle, LoginBonusType } from '../../shared/types/game';
import { SeedGenerator } from '../engine/seed-generator';

export class DailyCycleManager {
  private seedGenerator: SeedGenerator;

  constructor() {
    this.seedGenerator = new SeedGenerator();
  }

  /**
   * Generates a daily cycle for a specific date
   */
  generateDailyCycle(date: Date): DailyCycle {
    const dateString = this.formatDate(date);
    const seed = this.generateDailySeed(dateString);

    return {
      date: dateString,
      seed,
      weather: this.generateWeather(seed),
      lemonPrice: this.generateLemonPrice(seed),
      sugarPrice: this.generateSugarPrice(seed),
      event: this.generateMarketEvent(seed),
      multipliers: this.getMultipliers(),
      loginBonus: this.generateLoginBonus(seed)
    };
  }

  /**
   * Gets the current daily cycle
   */
  getCurrentDailyCycle(): DailyCycle {
    return this.generateDailyCycle(new Date());
  }

  /**
   * Generates deterministic weather based on date seed
   */
  private generateWeather(seed: string): WeatherType {
    const weatherTypes = Object.values(WeatherType);
    const weatherProbabilities = {
      [WeatherType.SUNNY]: 0.3,
      [WeatherType.HOT]: 0.15,
      [WeatherType.CLOUDY]: 0.25,
      [WeatherType.RAINY]: 0.2,
      [WeatherType.COLD]: 0.1
    };

    const random = this.seedGenerator.createSeededRandom(seed + '_weather')();
    let cumulative = 0;

    for (const weather of weatherTypes) {
      cumulative += weatherProbabilities[weather];
      if (random <= cumulative) {
        return weather;
      }
    }

    return WeatherType.SUNNY; // Fallback
  }

  /**
   * Generates market event with probabilities
   */
  private generateMarketEvent(seed: string): MarketEvent {
    const eventProbabilities = {
      [MarketEvent.NONE]: 0.7,
      [MarketEvent.VIRAL]: 0.1,
      [MarketEvent.SUGAR_SHORT]: 0.1,
      [MarketEvent.INFLATION]: 0.1
    };

    const random = this.seedGenerator.createSeededRandom(seed + '_event')();
    let cumulative = 0;

    for (const [event, probability] of Object.entries(eventProbabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return event as MarketEvent;
      }
    }

    return MarketEvent.NONE; // Fallback
  }

  /**
   * Generates daily lemon price using normal distribution
   */
  private generateLemonPrice(seed: string): number {
    const baseLemonPrice = 0.5; // Base price per lemon
    const variance = 0.15; // 15% variance
    
    // Use Box-Muller transform for normal distribution
    const random1 = this.seedGenerator.createSeededRandom(seed + '_lemon1')();
    const random2 = this.seedGenerator.createSeededRandom(seed + '_lemon2')();
    
    const normal = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
    const price = baseLemonPrice + (normal * variance);
    
    // Ensure price is positive and reasonable
    return Math.max(0.2, Math.min(1.0, Math.round(price * 100) / 100));
  }

  /**
   * Generates daily sugar price using normal distribution
   */
  private generateSugarPrice(seed: string): number {
    const baseSugarPrice = 0.3; // Base price per sugar unit
    const variance = 0.1; // 10% variance
    
    // Use Box-Muller transform for normal distribution
    const random1 = this.seedGenerator.createSeededRandom(seed + '_sugar1')();
    const random2 = this.seedGenerator.createSeededRandom(seed + '_sugar2')();
    
    const normal = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
    const price = baseSugarPrice + (normal * variance);
    
    // Ensure price is positive and reasonable
    return Math.max(0.15, Math.min(0.6, Math.round(price * 100) / 100));
  }

  /**
   * Generates login bonus for the day
   */
  private generateLoginBonus(seed: string): LoginBonusType {
    const bonusProbabilities = {
      [LoginBonusType.NONE]: 0.6,
      [LoginBonusType.PERFECT]: 0.15,
      [LoginBonusType.FREE_AD]: 0.15,
      [LoginBonusType.COOLER]: 0.1
    };

    const random = this.seedGenerator.createSeededRandom(seed + '_bonus')();
    let cumulative = 0;

    for (const [bonus, probability] of Object.entries(bonusProbabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return bonus as LoginBonusType;
      }
    }

    return LoginBonusType.NONE; // Fallback
  }

  /**
   * Gets static multipliers for weather and events
   */
  private getMultipliers() {
    return {
      demand: {
        [WeatherType.SUNNY]: 1.2,
        [WeatherType.HOT]: 1.5,
        [WeatherType.CLOUDY]: 1.0,
        [WeatherType.RAINY]: 0.6,
        [WeatherType.COLD]: 0.4
      },
      event: {
        [MarketEvent.NONE]: 1.0,
        [MarketEvent.VIRAL]: 2.0,
        [MarketEvent.SUGAR_SHORT]: 0.8,
        [MarketEvent.INFLATION]: 0.9
      },
      cost: {
        [MarketEvent.NONE]: 1.0,
        [MarketEvent.VIRAL]: 1.0,
        [MarketEvent.SUGAR_SHORT]: 1.3,
        [MarketEvent.INFLATION]: 1.2
      }
    };
  }

  /**
   * Generates a deterministic seed for a specific date
   */
  private generateDailySeed(dateString: string): string {
    // Create hash from date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Formats date as YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const isoString = date.toISOString();
    const datePart = isoString.split('T')[0];
    return datePart || isoString.substring(0, 10);
  }

  /**
   * Gets the UTC date for consistent daily cycles across timezones
   */
  getUTCDate(): Date {
    const now = new Date();
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  }
}

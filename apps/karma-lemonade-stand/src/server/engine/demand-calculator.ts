import { WeatherType, MarketEvent, FestivalModifiers, PaymentReceipt } from '../../shared/types/game';
import { GameConfig } from '../../shared/types/config';
import { SeedGenerator } from './seed-generator';

interface DemandInput {
  price: number;
  adSpend: number;
  userStats: {
    service: number;
    marketing: number;
    reputation: number;
  };
  weather: WeatherType;
  event: MarketEvent;
  festival: string;
  festivalModifiers: FestivalModifiers;
  powerupReceipts: PaymentReceipt[];
  seed: string;
}

export class DemandCalculator {
  private config: GameConfig;
  private seedGenerator: SeedGenerator;

  constructor(config: GameConfig) {
    this.config = config;
    this.seedGenerator = new SeedGenerator();
  }

  /**
   * Calculates total demand (cups sold) based on all factors
   */
  calculateDemand(input: DemandInput): number {
    // Start with base customer count
    let customers = this.config.economy.baseCustomers;

    // Apply price elasticity
    customers *= this.calculatePriceEffect(input.price);

    // Apply advertising effect
    customers *= this.calculateAdvertisingEffect(input.adSpend, input.userStats.marketing);

    // Apply reputation bonus
    customers *= this.calculateReputationEffect(input.userStats.reputation);

    // Apply service quality effect
    customers *= this.calculateServiceEffect(input.userStats.service);

    // Apply weather modifier
    customers *= this.getWeatherMultiplier(input.weather);

    // Apply market event modifier
    customers *= this.getEventMultiplier(input.event);

    // Apply festival modifier
    customers *= input.festivalModifiers.demandMultiplier || 1.0;

    // Apply powerup effects
    customers *= this.calculatePowerupEffect(input.powerupReceipts);

    // Add some randomness based on seed
    customers *= this.calculateRandomVariance(input.seed, input.festivalModifiers.priceVariance || 0.1);

    // Apply critical sale chance for bonus customers
    if (this.checkCriticalSale(input.seed, input.festivalModifiers.criticalSaleChance || 0.05)) {
      customers *= 1.5; // 50% bonus on critical sales
    }

    // Round to whole customers and ensure minimum of 0
    return Math.max(0, Math.round(customers));
  }

  /**
   * Calculates price elasticity effect on demand
   */
  private calculatePriceEffect(price: number): number {
    const { priceElasticity } = this.config.economy;
    // Higher prices reduce demand exponentially
    return Math.pow(1 - priceElasticity, price - 1);
  }

  /**
   * Calculates advertising effect on demand
   */
  private calculateAdvertisingEffect(adSpend: number, marketingSkill: number): number {
    const { adEffect } = this.config.economy;
    // Advertising has diminishing returns, marketing skill improves efficiency
    const efficiency = 1 + (marketingSkill * 0.1);
    return 1 + (adEffect * Math.sqrt(adSpend) * efficiency);
  }

  /**
   * Calculates reputation effect on demand
   */
  private calculateReputationEffect(reputation: number): number {
    const { reputationEffect } = this.config.economy;
    return 1 + (reputation * reputationEffect);
  }

  /**
   * Calculates service quality effect on demand
   */
  private calculateServiceEffect(service: number): number {
    // Service affects customer satisfaction and word-of-mouth
    return 1 + (service * 0.02);
  }

  /**
   * Gets weather multiplier for demand
   */
  private getWeatherMultiplier(weather: WeatherType): number {
    const multipliers = {
      [WeatherType.SUNNY]: 1.2,
      [WeatherType.HOT]: 1.5,
      [WeatherType.CLOUDY]: 1.0,
      [WeatherType.RAINY]: 0.6,
      [WeatherType.COLD]: 0.4
    };
    return multipliers[weather] || 1.0;
  }

  /**
   * Gets market event multiplier for demand
   */
  private getEventMultiplier(event: MarketEvent): number {
    const multipliers = {
      [MarketEvent.NONE]: 1.0,
      [MarketEvent.VIRAL]: 2.0,
      [MarketEvent.SUGAR_SHORT]: 0.8,
      [MarketEvent.INFLATION]: 0.9
    };
    return multipliers[event] || 1.0;
  }

  /**
   * Calculates powerup effects on demand
   */
  private calculatePowerupEffect(receipts: PaymentReceipt[]): number {
    let multiplier = 1.0;
    
    for (const receipt of receipts) {
      const powerupConfig = this.config.payments.powerups[receipt.sku];
      if (powerupConfig?.effects.type === 'SUPER_SUGAR') {
        multiplier *= (1 + powerupConfig.effects.demandBonus);
      }
    }
    
    return multiplier;
  }

  /**
   * Adds random variance to demand based on seed
   */
  private calculateRandomVariance(seed: string, variance: number): number {
    // Generate random multiplier between (1-variance) and (1+variance)
    const random = this.seedGenerator.createSeededRandom(seed)();
    return 1 + ((random - 0.5) * 2 * variance);
  }

  /**
   * Checks if a critical sale occurs (bonus customers)
   */
  private checkCriticalSale(seed: string, criticalChance: number): boolean {
    return this.seedGenerator.randomBool(seed + '_critical', criticalChance);
  }
}

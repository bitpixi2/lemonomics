import { MarketEvent, FestivalModifiers } from '../../shared/types/game';
import { GameConfig } from '../../shared/types/config';

interface ProfitInput {
  cupsSold: number;
  price: number;
  adSpend: number;
  lemonPrice: number;
  sugarPrice: number;
  event: MarketEvent;
  festivalModifiers: FestivalModifiers;
}

export class ProfitCalculator {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * Calculates total profit from a game run
   */
  calculateProfit(input: ProfitInput): number {
    // Calculate revenue
    const revenue = input.cupsSold * input.price;

    // Calculate costs
    const inventoryCost = this.calculateInventoryCost(input.cupsSold, input.lemonPrice, input.sugarPrice, input.event, input.festivalModifiers);
    const fixedCost = this.config.economy.fixedCostPerDay;
    const advertisingCost = input.adSpend;

    // Total costs
    const totalCosts = inventoryCost + fixedCost + advertisingCost;

    // Calculate profit
    const profit = revenue - totalCosts;

    // Round to 2 decimal places
    return Math.round(profit * 100) / 100;
  }

  /**
   * Calculates inventory costs including ingredient prices and market effects
   */
  private calculateInventoryCost(
    cupsSold: number,
    lemonPrice: number,
    sugarPrice: number,
    event: MarketEvent,
    festivalModifiers: FestivalModifiers
  ): number {
    // Base inventory cost per cup
    let costPerCup = this.config.economy.inventoryCostPerCup;

    // Add ingredient costs (lemons and sugar)
    const ingredientCost = (lemonPrice + sugarPrice) * 0.1; // 10% of ingredient prices per cup
    costPerCup += ingredientCost;

    // Apply market event cost modifiers
    costPerCup *= this.getEventCostMultiplier(event);

    // Apply festival cost volatility
    if (festivalModifiers.costVolatility) {
      // Cost volatility can increase or decrease costs
      const volatilityMultiplier = 1 + (festivalModifiers.costVolatility * 0.5);
      costPerCup *= volatilityMultiplier;
    }

    // Total inventory cost
    const totalInventoryCost = cupsSold * costPerCup;

    return Math.round(totalInventoryCost * 100) / 100;
  }

  /**
   * Gets cost multiplier for market events
   */
  private getEventCostMultiplier(event: MarketEvent): number {
    const multipliers = {
      [MarketEvent.NONE]: 1.0,
      [MarketEvent.VIRAL]: 1.0, // No cost effect
      [MarketEvent.SUGAR_SHORT]: 1.3, // Higher ingredient costs
      [MarketEvent.INFLATION]: 1.2 // General cost increase
    };
    return multipliers[event] || 1.0;
  }

  /**
   * Calculates breakdown of costs for detailed reporting
   */
  calculateCostBreakdown(input: ProfitInput): {
    revenue: number;
    inventoryCost: number;
    fixedCost: number;
    advertisingCost: number;
    totalCosts: number;
    profit: number;
  } {
    const revenue = input.cupsSold * input.price;
    const inventoryCost = this.calculateInventoryCost(
      input.cupsSold,
      input.lemonPrice,
      input.sugarPrice,
      input.event,
      input.festivalModifiers
    );
    const fixedCost = this.config.economy.fixedCostPerDay;
    const advertisingCost = input.adSpend;
    const totalCosts = inventoryCost + fixedCost + advertisingCost;
    const profit = revenue - totalCosts;

    return {
      revenue: Math.round(revenue * 100) / 100,
      inventoryCost: Math.round(inventoryCost * 100) / 100,
      fixedCost: Math.round(fixedCost * 100) / 100,
      advertisingCost: Math.round(advertisingCost * 100) / 100,
      totalCosts: Math.round(totalCosts * 100) / 100,
      profit: Math.round(profit * 100) / 100
    };
  }
}

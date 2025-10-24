import { WeeklyCycle, FestivalModifiers } from '../../shared/types/game';
import { FESTIVAL_THEMES, FestivalTheme } from '../../shared/types/config';
import { SeedGenerator } from '../engine/seed-generator';

export class WeeklyCycleManager {
  private seedGenerator: SeedGenerator;
  private festivalThemes: FestivalTheme[];

  constructor() {
    this.seedGenerator = new SeedGenerator();
    this.festivalThemes = Object.values(FESTIVAL_THEMES);
  }

  /**
   * Generates a weekly cycle for a specific week
   */
  generateWeeklyCycle(year: number, week: number): WeeklyCycle {
    const seed = this.generateWeeklySeed(year, week);
    const festival = this.selectFestival(seed);
    const theme = FESTIVAL_THEMES[festival];
    
    if (!theme) {
      throw new Error(`Festival theme not found: ${festival}`);
    }

    return {
      week,
      year,
      festival,
      modifiers: this.generateFestivalModifiers(theme, seed)
    };
  }

  /**
   * Gets the current weekly cycle
   */
  getCurrentWeeklyCycle(): WeeklyCycle {
    const { year, week } = this.getCurrentWeek();
    return this.generateWeeklyCycle(year, week);
  }

  /**
   * Selects a festival theme for the week
   */
  private selectFestival(seed: string): string {
    // Use seed to deterministically select a festival
    const random = this.seedGenerator.createSeededRandom(seed + '_festival')();
    const index = Math.floor(random * this.festivalThemes.length);
    const selectedTheme = this.festivalThemes[index];
    if (!selectedTheme) {
      // Fallback to first theme if selection fails
      return this.festivalThemes[0]?.id || 'SUMMER_SOLSTICE';
    }
    return selectedTheme.id;
  }

  /**
   * Generates festival modifiers with some randomization
   */
  private generateFestivalModifiers(theme: FestivalTheme, seed: string): FestivalModifiers {
    const baseModifiers = theme.modifiers || {};
    
    // Add some variance to the base modifiers
    const demandVariance = this.seedGenerator.randomFloat(seed + '_demand', -0.05, 0.05);
    const priceVariance = this.seedGenerator.randomFloat(seed + '_price', -0.02, 0.02);
    const criticalVariance = this.seedGenerator.randomFloat(seed + '_critical', -0.02, 0.02);
    const costVariance = this.seedGenerator.randomFloat(seed + '_cost', -0.05, 0.05);

    return {
      demandMultiplier: Math.max(0.5, (baseModifiers.demandMultiplier || 1.0) + demandVariance),
      priceVariance: Math.max(0, Math.min(0.5, (baseModifiers.priceVariance || 0.1) + priceVariance)),
      criticalSaleChance: Math.max(0, Math.min(0.5, (baseModifiers.criticalSaleChance || 0.05) + criticalVariance)),
      costVolatility: Math.max(-0.3, Math.min(0.3, (baseModifiers.costVolatility || 0) + costVariance)),
      specialEffects: baseModifiers.specialEffects || []
    };
  }

  /**
   * Gets all available festival themes organized by category
   */
  getFestivalsByCategory() {
    const categories = {
      holiday: [] as FestivalTheme[],
      aesthetic: [] as FestivalTheme[],
      era: [] as FestivalTheme[],
      genre: [] as FestivalTheme[]
    };

    for (const theme of this.festivalThemes) {
      categories[theme.category].push(theme);
    }

    return categories;
  }

  /**
   * Gets festival theme by ID
   */
  getFestivalTheme(festivalId: string): FestivalTheme | undefined {
    return FESTIVAL_THEMES[festivalId];
  }

  /**
   * Gets the current week number and year
   */
  private getCurrentWeek(): { year: number; week: number } {
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    
    // Get the first day of the year
    const startOfYear = new Date(utcDate.getUTCFullYear(), 0, 1);
    
    // Calculate days since start of year
    const daysSinceStart = Math.floor((utcDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    
    // Calculate week number (ISO week numbering)
    const week = Math.ceil((daysSinceStart + startOfYear.getUTCDay() + 1) / 7);
    
    return {
      year: utcDate.getUTCFullYear(),
      week: Math.min(53, Math.max(1, week)) // Ensure week is between 1-53
    };
  }

  /**
   * Generates a deterministic seed for a specific week
   */
  private generateWeeklySeed(year: number, week: number): string {
    const input = `${year}-W${week}`;
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString();
  }

  /**
   * Gets the week number for a specific date
   */
  getWeekForDate(date: Date): { year: number; week: number } {
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const startOfYear = new Date(utcDate.getUTCFullYear(), 0, 1);
    const daysSinceStart = Math.floor((utcDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((daysSinceStart + startOfYear.getUTCDay() + 1) / 7);
    
    return {
      year: utcDate.getUTCFullYear(),
      week: Math.min(53, Math.max(1, week))
    };
  }

  /**
   * Checks if it's time for weekly reset (Sunday 23:55 UTC)
   */
  isWeeklyResetTime(): boolean {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    return utcDay === 0 && utcHour === 23 && utcMinute >= 55;
  }
}

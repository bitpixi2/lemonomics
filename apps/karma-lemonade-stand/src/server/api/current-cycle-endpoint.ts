import { Request, Response } from 'express';
import { DailyCycleManager } from '../cycles/daily-cycle-manager.js';
import { WeeklyCycleManager } from '../cycles/weekly-cycle-manager.js';
import { DailyCycle, WeeklyCycle } from '../../shared/types/game.js';

export interface CurrentCycleResponse {
  success: boolean;
  daily?: DailyCycle;
  weekly?: WeeklyCycle;
  error?: string;
}

export class CurrentCycleEndpoint {
  private dailyCycleManager: DailyCycleManager;
  private weeklyCycleManager: WeeklyCycleManager;

  constructor() {
    this.dailyCycleManager = new DailyCycleManager();
    this.weeklyCycleManager = new WeeklyCycleManager();
  }

  async handleGetCurrentCycle(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.query;

      let dailyCycle: DailyCycle | undefined;
      let weeklyCycle: WeeklyCycle | undefined;

      // Get requested cycle information
      if (!type || type === 'daily') {
        dailyCycle = await this.dailyCycleManager.getCurrentCycle();
      }

      if (!type || type === 'weekly') {
        weeklyCycle = await this.weeklyCycleManager.getCurrentCycle();
      }

      res.json({
        success: true,
        daily: dailyCycle,
        weekly: weeklyCycle
      });

    } catch (error) {
      console.error('Current cycle endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load current cycle information'
      });
    }
  }

  async handleGetCycleHistory(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'daily', days = 7 } = req.query;
      const maxDays = Math.min(parseInt(days as string) || 7, 30);

      let history: (DailyCycle | WeeklyCycle)[] = [];

      if (type === 'daily') {
        history = await this.getDailyHistory(maxDays);
      } else if (type === 'weekly') {
        history = await this.getWeeklyHistory(maxDays);
      }

      res.json({
        success: true,
        history,
        type
      });

    } catch (error) {
      console.error('Cycle history endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load cycle history'
      });
    }
  }

  private async getDailyHistory(days: number): Promise<DailyCycle[]> {
    const history: DailyCycle[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const cycle = await this.dailyCycleManager.getCycleForDate(date);
      if (cycle) {
        history.push(cycle);
      }
    }

    return history;
  }

  private async getWeeklyHistory(weeks: number): Promise<WeeklyCycle[]> {
    const history: WeeklyCycle[] = [];
    const today = new Date();

    for (let i = 0; i < weeks; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      
      const cycle = await this.weeklyCycleManager.getCycleForDate(date);
      if (cycle) {
        history.push(cycle);
      }
    }

    return history;
  }
}

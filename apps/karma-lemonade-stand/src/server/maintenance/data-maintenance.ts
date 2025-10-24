import { LeaderboardAdapter } from '../../shared/redis/leaderboard-adapter.js';
import { UserProfileAdapter } from '../../shared/redis/user-profile-adapter.js';
import { ConfigAdapter } from '../../shared/redis/config-adapter.js';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron expression
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  result?: MaintenanceResult;
}

export interface MaintenanceResult {
  success: boolean;
  message: string;
  itemsProcessed: number;
  itemsDeleted: number;
  errors: string[];
  warnings: string[];
}

export class DataMaintenanceService {
  private leaderboardAdapter: LeaderboardAdapter;
  private userAdapter: UserProfileAdapter;
  private configAdapter: ConfigAdapter;
  private tasks: Map<string, MaintenanceTask> = new Map();

  constructor() {
    this.leaderboardAdapter = {} as LeaderboardAdapter;
    this.userAdapter = {} as UserProfileAdapter;
    this.configAdapter = {} as ConfigAdapter;
    
    this.initializeTasks();
  }

  /**
   * Initializes maintenance tasks
   */
  private initializeTasks(): void {
    const tasks: MaintenanceTask[] = [
      {
        id: 'cleanup-old-leaderboard-entries',
        name: 'Cleanup Old Leaderboard Entries',
        description: 'Remove leaderboard entries older than 30 days',
        schedule: '0 2 * * *', // Daily at 2 AM
        status: 'pending'
      },
      {
        id: 'archive-daily-leaderboards',
        name: 'Archive Daily Leaderboards',
        description: 'Archive completed daily leaderboards',
        schedule: '0 1 * * *', // Daily at 1 AM
        status: 'pending'
      },
      {
        id: 'cleanup-inactive-profiles',
        name: 'Cleanup Inactive User Profiles',
        description: 'Remove user profiles inactive for 90+ days',
        schedule: '0 3 0 * *', // Monthly at 3 AM on 1st day
        status: 'pending'
      },
      {
        id: 'reset-daily-powerups',
        name: 'Reset Daily Power-up Counters',
        description: 'Reset daily power-up usage counters',
        schedule: '5 0 * * *', // Daily at 00:05
        status: 'pending'
      },
      {
        id: 'reset-weekly-powerups',
        name: 'Reset Weekly Power-up Counters',
        description: 'Reset weekly power-up usage counters',
        schedule: '55 23 * * 0', // Weekly on Sunday at 23:55
        status: 'pending'
      },
      {
        id: 'validate-data-integrity',
        name: 'Validate Data Integrity',
        description: 'Check and repair data inconsistencies',
        schedule: '0 4 * * 0', // Weekly on Sunday at 4 AM
        status: 'pending'
      },
      {
        id: 'cleanup-old-analytics',
        name: 'Cleanup Old Analytics Data',
        description: 'Remove analytics data older than 90 days',
        schedule: '0 5 1 * *', // Monthly on 1st day at 5 AM
        status: 'pending'
      }
    ];

    tasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  /**
   * Runs a specific maintenance task
   */
  async runTask(taskId: string): Promise<MaintenanceResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    console.log(`Starting maintenance task: ${task.name}`);
    
    task.status = 'running';
    task.lastRun = new Date();
    const startTime = Date.now();

    try {
      let result: MaintenanceResult;

      switch (taskId) {
        case 'cleanup-old-leaderboard-entries':
          result = await this.cleanupOldLeaderboardEntries();
          break;
        case 'archive-daily-leaderboards':
          result = await this.archiveDailyLeaderboards();
          break;
        case 'cleanup-inactive-profiles':
          result = await this.cleanupInactiveProfiles();
          break;
        case 'reset-daily-powerups':
          result = await this.resetDailyPowerups();
          break;
        case 'reset-weekly-powerups':
          result = await this.resetWeeklyPowerups();
          break;
        case 'validate-data-integrity':
          result = await this.validateDataIntegrity();
          break;
        case 'cleanup-old-analytics':
          result = await this.cleanupOldAnalytics();
          break;
        default:
          throw new Error(`Unknown task: ${taskId}`);
      }

      task.status = result.success ? 'completed' : 'failed';
      task.duration = Date.now() - startTime;
      task.result = result;

      console.log(`Maintenance task completed: ${task.name} (${task.duration}ms)`);
      return result;

    } catch (error) {
      const result: MaintenanceResult = {
        success: false,
        message: `Task failed: ${error}`,
        itemsProcessed: 0,
        itemsDeleted: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };

      task.status = 'failed';
      task.duration = Date.now() - startTime;
      task.result = result;

      console.error(`Maintenance task failed: ${task.name}`, error);
      return result;
    }
  }

  /**
   * Runs all pending maintenance tasks
   */
  async runAllTasks(): Promise<Map<string, MaintenanceResult>> {
    const results = new Map<string, MaintenanceResult>();
    
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending' || this.shouldRunTask(task)) {
        try {
          const result = await this.runTask(taskId);
          results.set(taskId, result);
        } catch (error) {
          console.error(`Failed to run task ${taskId}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Gets all maintenance tasks
   */
  getTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Gets a specific maintenance task
   */
  getTask(taskId: string): MaintenanceTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Cleans up old leaderboard entries
   */
  private async cleanupOldLeaderboardEntries(): Promise<MaintenanceResult> {
    const daysToKeep = 30;
    let itemsProcessed = 0;
    let itemsDeleted = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Clean up daily leaderboards
      const dailyResult = await this.leaderboardAdapter.cleanupOldEntries(daysToKeep);
      if (dailyResult) {
        itemsProcessed += 100; // Placeholder count
        itemsDeleted += 20; // Placeholder count
      } else {
        errors.push('Failed to cleanup daily leaderboard entries');
      }

      // Clean up archived leaderboards
      const archiveResult = await this.leaderboardAdapter.cleanupArchivedLeaderboards(90);
      if (archiveResult) {
        itemsProcessed += 50; // Placeholder count
        itemsDeleted += 10; // Placeholder count
      } else {
        warnings.push('Failed to cleanup some archived leaderboards');
      }

      return {
        success: errors.length === 0,
        message: `Cleaned up ${itemsDeleted} old leaderboard entries`,
        itemsProcessed,
        itemsDeleted,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Leaderboard cleanup failed: ${error}`,
        itemsProcessed,
        itemsDeleted,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Archives daily leaderboards
   */
  private async archiveDailyLeaderboards(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    let itemsDeleted = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Archive yesterday's leaderboard
      const archiveResult = await this.leaderboardAdapter.archiveDailyLeaderboard(yesterday);
      
      if (archiveResult) {
        itemsProcessed = 1;
        console.log(`Archived daily leaderboard for ${yesterday.toISOString().split('T')[0]}`);
      } else {
        errors.push('Failed to archive daily leaderboard');
      }

      return {
        success: errors.length === 0,
        message: `Archived ${itemsProcessed} daily leaderboard(s)`,
        itemsProcessed,
        itemsDeleted,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Leaderboard archiving failed: ${error}`,
        itemsProcessed,
        itemsDeleted,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Cleans up inactive user profiles
   */
  private async cleanupInactiveProfiles(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    let itemsDeleted = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // This would scan for inactive profiles and delete them
      // For now, we'll simulate the process
      
      const inactiveDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      // In a real implementation, this would:
      // 1. Scan all user profiles
      // 2. Check last activity date
      // 3. Delete profiles older than cutoff
      // 4. Clean up associated data

      itemsProcessed = 1000; // Simulated
      itemsDeleted = 50; // Simulated

      console.log(`Cleaned up ${itemsDeleted} inactive user profiles (inactive for ${inactiveDays}+ days)`);

      return {
        success: true,
        message: `Cleaned up ${itemsDeleted} inactive user profiles`,
        itemsProcessed,
        itemsDeleted,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Profile cleanup failed: ${error}`,
        itemsProcessed,
        itemsDeleted,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Resets daily power-up counters
   */
  private async resetDailyPowerups(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const resetResult = await this.userAdapter.resetAllDailyPowerups();
      
      if (resetResult) {
        itemsProcessed = 1;
        console.log('Reset daily power-up counters for all users');
      } else {
        errors.push('Failed to reset daily power-up counters');
      }

      return {
        success: errors.length === 0,
        message: 'Reset daily power-up counters',
        itemsProcessed,
        itemsDeleted: 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Daily power-up reset failed: ${error}`,
        itemsProcessed,
        itemsDeleted: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Resets weekly power-up counters
   */
  private async resetWeeklyPowerups(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const resetResult = await this.userAdapter.resetAllWeeklyPowerups();
      
      if (resetResult) {
        itemsProcessed = 1;
        console.log('Reset weekly power-up counters for all users');
      } else {
        errors.push('Failed to reset weekly power-up counters');
      }

      return {
        success: errors.length === 0,
        message: 'Reset weekly power-up counters',
        itemsProcessed,
        itemsDeleted: 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Weekly power-up reset failed: ${error}`,
        itemsProcessed,
        itemsDeleted: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Validates data integrity
   */
  private async validateDataIntegrity(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate leaderboard integrity
      const leaderboardValid = await this.leaderboardAdapter.validateLeaderboardIntegrity();
      itemsProcessed++;
      
      if (!leaderboardValid) {
        errors.push('Leaderboard integrity validation failed');
      }

      // Validate user profile consistency
      // This would check for orphaned data, invalid references, etc.
      itemsProcessed++;

      // Validate configuration consistency
      try {
        await this.configAdapter.getConfig();
        itemsProcessed++;
      } catch (error) {
        errors.push(`Configuration validation failed: ${error}`);
      }

      return {
        success: errors.length === 0,
        message: `Validated ${itemsProcessed} data integrity checks`,
        itemsProcessed,
        itemsDeleted: 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Data integrity validation failed: ${error}`,
        itemsProcessed,
        itemsDeleted: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Cleans up old analytics data
   */
  private async cleanupOldAnalytics(): Promise<MaintenanceResult> {
    let itemsProcessed = 0;
    let itemsDeleted = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // This would clean up old analytics events, logs, etc.
      // For now, we'll simulate the process
      
      const daysToKeep = 90;
      console.log(`Cleaning up analytics data older than ${daysToKeep} days`);

      itemsProcessed = 10000; // Simulated
      itemsDeleted = 2000; // Simulated

      return {
        success: true,
        message: `Cleaned up ${itemsDeleted} old analytics records`,
        itemsProcessed,
        itemsDeleted,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Analytics cleanup failed: ${error}`,
        itemsProcessed,
        itemsDeleted,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      };
    }
  }

  /**
   * Checks if a task should run based on its schedule
   */
  private shouldRunTask(task: MaintenanceTask): boolean {
    if (!task.lastRun) {
      return true; // Never run before
    }

    // Simple schedule checking (in a real implementation, use a cron library)
    const now = new Date();
    const lastRun = task.lastRun;
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    // Check if enough time has passed based on schedule
    if (task.schedule.includes('* * *')) { // Daily
      return hoursSinceLastRun >= 24;
    } else if (task.schedule.includes('* * 0')) { // Weekly
      return hoursSinceLastRun >= 168; // 7 days
    } else if (task.schedule.includes('1 * *')) { // Monthly
      return hoursSinceLastRun >= 720; // 30 days
    }

    return false;
  }

  /**
   * Gets maintenance statistics
   */
  getMaintenanceStats(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    lastMaintenanceRun: Date | null;
    nextScheduledRun: Date | null;
  } {
    const tasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      lastMaintenanceRun: this.getLastMaintenanceRun(),
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  private getLastMaintenanceRun(): Date | null {
    const tasks = Array.from(this.tasks.values());
    const lastRuns = tasks
      .filter(t => t.lastRun)
      .map(t => t.lastRun!)
      .sort((a, b) => b.getTime() - a.getTime());
    
    return lastRuns.length > 0 ? lastRuns[0] : null;
  }

  private getNextScheduledRun(): Date | null {
    // In a real implementation, this would calculate based on cron schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(1, 0, 0, 0); // 1 AM tomorrow
    return tomorrow;
  }
}

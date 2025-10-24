// Global configuration Redis storage adapter
import type { GameConfig } from '../types/config.js';
import { DEFAULT_CONFIG } from '../types/config.js';
import type { GameRedisClient } from './client.js';

export class ConfigAdapter {
  private redis: GameRedisClient;
  private cachedConfig: GameConfig | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(redis: GameRedisClient) {
    this.redis = redis;
  }

  async getConfig(): Promise<GameConfig> {
    try {
      // Return cached config if still valid
      const now = Date.now();
      if (this.cachedConfig && (now - this.lastCacheTime) < this.CACHE_TTL) {
        return this.cachedConfig;
      }

      const configData = await this.redis.getGlobalConfig();
      let config: GameConfig;

      if (!configData) {
        // No config exists, use default
        config = { ...DEFAULT_CONFIG };
        await this.setConfig(config);
      } else {
        config = JSON.parse(configData) as GameConfig;
        // Merge with defaults to ensure all properties exist
        config = this.mergeWithDefaults(config);
      }

      // Cache the config
      this.cachedConfig = config;
      this.lastCacheTime = now;

      return config;
    } catch (error) {
      console.error('Error getting config, using defaults:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  async setConfig(config: GameConfig): Promise<boolean> {
    try {
      const configData = JSON.stringify(config);
      await this.redis.setGlobalConfig(configData);
      
      // Update cache
      this.cachedConfig = config;
      this.lastCacheTime = Date.now();
      
      return true;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    }
  }

  async updateConfig(updates: Partial<GameConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig: GameConfig = {
        ...currentConfig,
        ...updates,
        // Deep merge nested objects
        ...(updates.game && {
          game: {
            ...currentConfig.game,
            ...updates.game
          }
        }),
        ...(updates.economy && {
          economy: {
            ...currentConfig.economy,
            ...updates.economy
          }
        }),
        ...(updates.statScaling && {
          statScaling: {
            ...currentConfig.statScaling,
            ...updates.statScaling
          }
        }),
        ...(updates.limits && {
          limits: {
            ...currentConfig.limits,
            ...updates.limits
          }
        }),
        ...(updates.payments && {
          payments: {
            ...currentConfig.payments,
            ...updates.payments,
            ...(updates.payments.powerups && {
              powerups: {
                ...currentConfig.payments.powerups,
                ...updates.payments.powerups
              }
            })
          }
        }),
        ...(updates.festivals && {
          festivals: {
            ...currentConfig.festivals,
            ...updates.festivals
          }
        })
      };

      return await this.setConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  async getGameSettings(): Promise<GameConfig['game']> {
    const config = await this.getConfig();
    return config.game;
  }

  async getEconomySettings(): Promise<GameConfig['economy']> {
    const config = await this.getConfig();
    return config.economy;
  }

  async getStatScaling(): Promise<GameConfig['statScaling']> {
    const config = await this.getConfig();
    return config.statScaling;
  }

  async getLimits(): Promise<GameConfig['limits']> {
    const config = await this.getConfig();
    return config.limits;
  }

  async getPaymentSettings(): Promise<GameConfig['payments']> {
    const config = await this.getConfig();
    return config.payments;
  }

  async getFestivals(): Promise<GameConfig['festivals']> {
    const config = await this.getConfig();
    return config.festivals;
  }

  async updateGameSettings(settings: Partial<GameConfig['game']>): Promise<boolean> {
    const currentConfig = await this.getConfig();
    const updatedGame = {
      ...currentConfig.game,
      ...settings
    };
    return await this.updateConfig({ game: updatedGame });
  }

  async updateEconomySettings(settings: Partial<GameConfig['economy']>): Promise<boolean> {
    const currentConfig = await this.getConfig();
    const updatedEconomy = {
      ...currentConfig.economy,
      ...settings
    };
    return await this.updateConfig({ economy: updatedEconomy });
  }

  async updateStatScaling(settings: Partial<GameConfig['statScaling']>): Promise<boolean> {
    const currentConfig = await this.getConfig();
    const updatedStatScaling = {
      ...currentConfig.statScaling,
      ...settings
    };
    return await this.updateConfig({ statScaling: updatedStatScaling });
  }

  async updateLimits(settings: Partial<GameConfig['limits']>): Promise<boolean> {
    const currentConfig = await this.getConfig();
    const updatedLimits = {
      ...currentConfig.limits,
      ...settings
    };
    return await this.updateConfig({ limits: updatedLimits });
  }

  async updatePaymentSettings(settings: Partial<GameConfig['payments']>): Promise<boolean> {
    const currentConfig = await this.getConfig();
    const updatedPayments = {
      ...currentConfig.payments,
      ...settings,
      powerups: {
        ...currentConfig.payments.powerups,
        ...(settings.powerups || {})
      }
    };
    return await this.updateConfig({ payments: updatedPayments });
  }

  async addFestival(festivalId: string, festival: GameConfig['festivals'][string]): Promise<boolean> {
    try {
      const config = await this.getConfig();
      const updatedFestivals = {
        ...config.festivals,
        [festivalId]: festival
      };
      return await this.updateConfig({ festivals: updatedFestivals });
    } catch (error) {
      console.error('Error adding festival:', error);
      return false;
    }
  }

  async removeFestival(festivalId: string): Promise<boolean> {
    try {
      const config = await this.getConfig();
      const updatedFestivals = { ...config.festivals };
      delete updatedFestivals[festivalId];
      return await this.updateConfig({ festivals: updatedFestivals });
    } catch (error) {
      console.error('Error removing festival:', error);
      return false;
    }
  }

  async resetToDefaults(): Promise<boolean> {
    try {
      return await this.setConfig({ ...DEFAULT_CONFIG });
    } catch (error) {
      console.error('Error resetting config to defaults:', error);
      return false;
    }
  }

  async getConfigVersion(): Promise<number> {
    const config = await this.getConfig();
    return config.version;
  }

  async incrementVersion(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return await this.updateConfig({ version: config.version + 1 });
    } catch (error) {
      console.error('Error incrementing config version:', error);
      return false;
    }
  }

  clearCache(): void {
    this.cachedConfig = null;
    this.lastCacheTime = 0;
  }

  private mergeWithDefaults(config: Partial<GameConfig>): GameConfig {
    return {
      version: config.version ?? DEFAULT_CONFIG.version,
      game: {
        ...DEFAULT_CONFIG.game,
        ...config.game
      },
      economy: {
        ...DEFAULT_CONFIG.economy,
        ...config.economy
      },
      statScaling: {
        ...DEFAULT_CONFIG.statScaling,
        ...config.statScaling
      },
      limits: {
        ...DEFAULT_CONFIG.limits,
        ...config.limits
      },
      payments: {
        ...DEFAULT_CONFIG.payments,
        ...config.payments,
        powerups: {
          ...DEFAULT_CONFIG.payments.powerups,
          ...config.payments?.powerups
        }
      },
      festivals: {
        ...DEFAULT_CONFIG.festivals,
        ...config.festivals
      }
    };
  }

  async setDailyCycle(cycle: any): Promise<boolean> {
    try {
      const cycleData = JSON.stringify(cycle);
      await this.redis.set('daily_cycle', cycleData);
      return true;
    } catch (error) {
      console.error('Error setting daily cycle:', error);
      return false;
    }
  }

  async getDailyCycle(): Promise<any> {
    try {
      const cycleData = await this.redis.get('daily_cycle');
      if (!cycleData) {
        return null;
      }
      return JSON.parse(cycleData);
    } catch (error) {
      console.error('Error getting daily cycle:', error);
      return null;
    }
  }

  async setWeeklyCycle(cycle: any): Promise<boolean> {
    try {
      const cycleData = JSON.stringify(cycle);
      await this.redis.set('weekly_cycle', cycleData);
      return true;
    } catch (error) {
      console.error('Error setting weekly cycle:', error);
      return false;
    }
  }

  async getWeeklyCycle(): Promise<any> {
    try {
      const cycleData = await this.redis.get('weekly_cycle');
      if (!cycleData) {
        return null;
      }
      return JSON.parse(cycleData);
    } catch (error) {
      console.error('Error getting weekly cycle:', error);
      return null;
    }
  }
}

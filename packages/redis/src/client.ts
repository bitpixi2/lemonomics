/**
 * Redis Client Configuration
 * 
 * Manages Redis connection with connection pooling and error handling.
 */

import Redis, { type RedisOptions } from 'ioredis';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  lazyConnect?: boolean;
}

class RedisClient {
  private static instance: RedisClient;
  private redis: Redis;
  private isConnected = false;

  private constructor(config: RedisConfig = {}) {
    const options: RedisOptions = {
      // Default configuration
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      ...config,
    };

    // Use Redis URL if provided, otherwise use individual options
    if (config.url) {
      this.redis = new Redis(config.url, options);
    } else {
      this.redis = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0,
        ...options,
      });
    }

    this.setupEventHandlers();
  }

  /**
   * Get singleton Redis client instance
   */
  public static getInstance(config?: RedisConfig): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  /**
   * Get the underlying Redis instance
   */
  public getRedis(): Redis {
    return this.redis;
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.redis.connect();
      this.isConnected = true;
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.redis.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from Redis');
    } catch (error) {
      console.error('❌ Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  /**
   * Check if Redis is connected
   */
  public isRedisConnected(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  /**
   * Ping Redis to check connection
   */
  public async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch (error) {
      console.error('❌ Redis ping failed:', error);
      throw error;
    }
  }

  /**
   * Execute Redis command with error handling
   */
  public async execute<T>(
    operation: (redis: Redis) => Promise<T>,
    operationName = 'Redis operation'
  ): Promise<T> {
    try {
      if (!this.isRedisConnected()) {
        await this.connect();
      }
      return await operation(this.redis);
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error);
      throw error;
    }
  }

  /**
   * Set up event handlers for connection monitoring
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('🔄 Redis connecting...');
    });

    this.redis.on('ready', () => {
      this.isConnected = true;
      console.log('✅ Redis ready');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (delay) => {
      console.log(`🔄 Redis reconnecting in ${delay}ms...`);
    });

    this.redis.on('end', () => {
      console.log('🔚 Redis connection ended');
      this.isConnected = false;
    });
  }
}

/**
 * Initialize Redis client with environment configuration
 */
export function createRedisClient(config?: RedisConfig): RedisClient {
  const defaultConfig: RedisConfig = {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return RedisClient.getInstance(mergedConfig);
}

/**
 * Get Redis client instance (creates if doesn't exist)
 */
export function getRedisClient(): RedisClient {
  return RedisClient.getInstance();
}

export { RedisClient };

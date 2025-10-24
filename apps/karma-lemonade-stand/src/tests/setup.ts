import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use test database
  
  // Mock console methods to reduce noise in tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = (...args: any[]) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleLog(...args);
    }
  };
  
  console.error = (...args: any[]) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args: any[]) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleWarn(...args);
    }
  };
});

afterAll(async () => {
  console.log('🏁 Test suite completed');
});

beforeEach(async () => {
  // Reset any global state before each test
  // This would typically include clearing test databases, resetting mocks, etc.
});

afterEach(async () => {
  // Clean up after each test
  // This would typically include clearing test data, resetting timers, etc.
});

// Mock implementations for external dependencies
export const mockRedisClient = {
  get: async (key: string) => null,
  set: async (key: string, value: string) => 'OK',
  del: async (key: string) => 1,
  exists: async (key: string) => false,
  expire: async (key: string, seconds: number) => true,
  zadd: async (key: string, score: number, member: string) => 1,
  zrange: async (key: string, start: number, stop: number) => [],
  zrank: async (key: string, member: string) => null,
  zscore: async (key: string, member: string) => null
};

// Mock Devvit context for testing
export const mockDevvitContext = {
  redis: mockRedisClient,
  userId: 'test-user-123',
  username: 'testuser',
  subredditName: 'test-subreddit',
  payments: {
    createPayment: async (options: any) => ({
      id: 'test-payment-123',
      status: 'completed',
      ...options
    }),
    getPayment: async (id: string) => ({
      id,
      status: 'completed',
      sku: 'super_sugar',
      amount: 99,
      currency: 'USD'
    })
  }
};

// Test utilities
export const testUtils = {
  /**
   * Creates a mock user profile for testing
   */
  createMockUserProfile: (overrides: any = {}) => ({
    userId: 'test-user',
    username: 'testuser',
    redditStats: {
      postKarma: 1000,
      commentKarma: 500,
      accountAgeDays: 365,
      awards: 5,
      lastUpdated: new Date()
    },
    gameStats: {
      service: 10,
      marketing: 8,
      reputation: 12
    },
    progress: {
      totalRuns: 5,
      currentStreak: 2,
      longestStreak: 3,
      bestProfit: 25.50,
      lastPlayDate: '2024-01-15',
      totalProfit: 100.25
    },
    powerups: {
      usedToday: {},
      lastResetDate: '2024-01-15'
    },
    ...overrides
  }),

  /**
   * Creates a mock game result for testing
   */
  createMockGameResult: (overrides: any = {}) => ({
    profit: 25.50,
    cupsSold: 45,
    weather: 'SUNNY',
    event: 'NONE',
    festival: 'summer-festival',
    streak: 3,
    seed: 'test-seed-123',
    powerupsApplied: [],
    ...overrides
  }),

  /**
   * Creates a mock game run for testing
   */
  createMockGameRun: (overrides: any = {}) => ({
    userId: 'test-user',
    price: 1.00,
    adSpend: 10,
    powerupReceipts: [],
    ...overrides
  }),

  /**
   * Waits for a specified amount of time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generates a random test user ID
   */
  generateTestUserId: () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generates a random test username
   */
  generateTestUsername: () => `testuser${Date.now()}${Math.random().toString(36).substr(2, 5)}`,

  /**
   * Creates a date string for testing (YYYY-MM-DD format)
   */
  createDateString: (daysOffset: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  },

  /**
   * Validates API response structure
   */
  validateApiResponse: (response: any, expectedProperties: string[]) => {
    expectedProperties.forEach(prop => {
      if (!response.hasOwnProperty(prop)) {
        throw new Error(`Missing expected property: ${prop}`);
      }
    });
    return true;
  },

  /**
   * Creates mock analytics data
   */
  createMockAnalytics: (overrides: any = {}) => ({
    totalGames: 100,
    uniquePlayers: 50,
    averageProfit: 15.25,
    topProfit: 75.50,
    powerupUsage: {
      super_sugar: 25,
      perfect_day: 10,
      free_ad: 15
    },
    errorRate: 2.5,
    retentionRate: 65.0,
    conversionRate: 12.5,
    ...overrides
  })
};

// Export commonly used test constants
export const TEST_CONSTANTS = {
  DEFAULT_PRICE: 1.00,
  DEFAULT_AD_SPEND: 10,
  MIN_PRICE: 0.25,
  MAX_PRICE: 3.00,
  MIN_AD_SPEND: 0,
  MAX_AD_SPEND: 50,
  TEST_TIMEOUT: 5000,
  POWERUP_SKUS: ['super_sugar', 'perfect_day', 'free_ad'],
  WEATHER_TYPES: ['SUNNY', 'HOT', 'CLOUDY', 'RAINY', 'COLD'],
  MARKET_EVENTS: ['NONE', 'VIRAL', 'SUGAR_SHORT', 'INFLATION']
};

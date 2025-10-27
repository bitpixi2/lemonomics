// Simplified game configuration for Lemonomics
export interface GameConfig {
  version: number;
  game: {
    minPrice: number;
    maxPrice: number;
    startingCash: number;
    freeSugarCups: number;
  };
  economy: {
    baseCustomers: number;
    priceElasticity: number;
    ingredientCosts: {
      lemon: number;
      sugar: number;
      cup: number;
    };
  };
  karma: {
    thresholds: {
      bronze: number;
      silver: number;
      gold: number;
    };
    multipliers: {
      bronze: number;
      silver: number;
      gold: number;
    };
  };
  weather: {
    multipliers: {
      sunny: number;
      cloudy: number;
      rainy: number;
    };
  };
  loginBonuses: {
    daily: number;
    streak3: number;
    streak7: number;
  };
  festivals: FestivalConfig[];
  ai: {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    fallbackDialogue: string[];
  };
  redis: {
    keyPrefix: string;
    ttl: {
      session: number; // seconds
      userProfile: number; // seconds
      leaderboard: number; // seconds
    };
  };
}

export interface FestivalConfig {
  id: string;
  name: string;
  audioFile: string;
  demandMultiplier?: number;
}

export enum FestivalCategory {
  HOLIDAY = 'holiday',
  SEASONAL = 'seasonal',
  THEMED = 'themed'
}

// Default configuration values for Lemonomics
export const DEFAULT_CONFIG: GameConfig = {
  version: 1,
  game: {
    minPrice: 0.05,
    maxPrice: 1.00,
    startingCash: 10.00,
    freeSugarCups: 2
  },
  economy: {
    baseCustomers: 50,
    priceElasticity: 0.8,
    ingredientCosts: {
      lemon: 0.05,
      sugar: 0.02,
      cup: 0.01
    }
  },
  karma: {
    thresholds: {
      bronze: 1000,
      silver: 5000,
      gold: 10000
    },
    multipliers: {
      bronze: 1.2,
      silver: 1.5,
      gold: 2.0
    }
  },
  weather: {
    multipliers: {
      sunny: 1.5,
      cloudy: 1.0,
      rainy: 0.5
    }
  },
  loginBonuses: {
    daily: 2.00,
    streak3: 5.00,
    streak7: 10.00
  },
  festivals: [
    {
      id: 'summer',
      name: 'Summer Festival',
      audioFile: 'festival-summer.mp3',
      demandMultiplier: 1.2
    },
    {
      id: 'christmas',
      name: 'Christmas Festival',
      audioFile: 'festival-christmas.mp3',
      demandMultiplier: 1.3
    },
    {
      id: 'halloween',
      name: 'Halloween Festival',
      audioFile: 'festival-halloween.mp3',
      demandMultiplier: 1.1
    },
    {
      id: 'medieval',
      name: 'Medieval Festival',
      audioFile: 'festival-medieval.mp3',
      demandMultiplier: 1.0
    },
    {
      id: 'festival',
      name: 'Generic Festival',
      audioFile: 'festival-generic.mp3',
      demandMultiplier: 1.1
    }
  ],
  ai: {
    enabled: true,
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7,
    fallbackDialogue: [
      "Great lemonade! Perfect for this weather.",
      "This hits the spot!",
      "Thanks for the refreshing drink!",
      "Your lemonade stand is doing well!",
      "Keep up the good work!"
    ]
  },
  redis: {
    keyPrefix: 'lemonomics:',
    ttl: {
      session: 3600, // 1 hour
      userProfile: 86400, // 24 hours
      leaderboard: 300 // 5 minutes
    }
  }
};

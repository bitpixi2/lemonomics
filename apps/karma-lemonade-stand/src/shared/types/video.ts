// Video asset types for the Lemonomics game
import { WeatherType } from './game.js';

export interface VideoAsset {
  type: 'intro' | 'ingredients' | 'customers' | 'loading-results' | 'results' | 'leaderboard';
  weather?: WeatherType;
  filename: string;
  duration?: number;
  preload?: boolean;
}

export interface VideoSequence {
  intro: VideoAsset;
  ingredients: VideoAsset;
  customers: VideoAsset;
  loadingResults: VideoAsset;
  results: VideoAsset;
}

export interface VideoPlayerState {
  currentVideo?: VideoAsset;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  progress: number;
}

export interface VideoConfig {
  basePath: string;
  preloadStrategy: 'none' | 'intro' | 'weather' | 'all';
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
}

export interface VideoAssetMap {
  intro: {
    [WeatherType.SUNNY]: VideoAsset;
    [WeatherType.WINDY]: VideoAsset;
    [WeatherType.RAINY]: VideoAsset;
  };
  ingredients: {
    [WeatherType.SUNNY]: VideoAsset;
    [WeatherType.WINDY]: VideoAsset;
    [WeatherType.RAINY]: VideoAsset;
  };
  customers: {
    [WeatherType.SUNNY]: VideoAsset;
    [WeatherType.WINDY]: VideoAsset;
    [WeatherType.RAINY]: VideoAsset;
  };
  loadingResults: {
    [WeatherType.SUNNY]: VideoAsset;
    [WeatherType.WINDY]: VideoAsset;
    [WeatherType.RAINY]: VideoAsset;
  };
  results: {
    [WeatherType.SUNNY]: VideoAsset;
    [WeatherType.WINDY]: VideoAsset;
    [WeatherType.RAINY]: VideoAsset;
  };
  leaderboard: {
    'leaderboard-screen': VideoAsset;
  };
}

// Video asset definitions using original naming convention
export const VIDEO_ASSETS: VideoAssetMap = {
  intro: {
    [WeatherType.SUNNY]: {
      type: 'intro',
      weather: WeatherType.SUNNY,
      filename: '/videos/Sunny_IntroScreen.mp4',
      preload: true
    },
    [WeatherType.WINDY]: {
      type: 'intro',
      weather: WeatherType.WINDY,
      filename: '/videos/Windy_IntroScreen.mp4',
      preload: true
    },
    [WeatherType.RAINY]: {
      type: 'intro',
      weather: WeatherType.RAINY,
      filename: '/videos/Rainy_IntroScreen.mp4',
      preload: true
    }
  },
  ingredients: {
    [WeatherType.SUNNY]: {
      type: 'ingredients',
      weather: WeatherType.SUNNY,
      filename: '/videos/Sunny_IngredientScreen.mp4',
      preload: true
    },
    [WeatherType.WINDY]: {
      type: 'ingredients',
      weather: WeatherType.WINDY,
      filename: '/videos/Windy_IngredientScreen.mp4',
      preload: true
    },
    [WeatherType.RAINY]: {
      type: 'ingredients',
      weather: WeatherType.RAINY,
      filename: '/videos/Rainy_IngredientScreen.mp4',
      preload: true
    }
  },
  customers: {
    [WeatherType.SUNNY]: {
      type: 'customers',
      weather: WeatherType.SUNNY,
      filename: '/videos/Sunny_CustomersScreen.mp4'
    },
    [WeatherType.WINDY]: {
      type: 'customers',
      weather: WeatherType.WINDY,
      filename: '/videos/Windy_CustomersScreen.mp4'
    },
    [WeatherType.RAINY]: {
      type: 'customers',
      weather: WeatherType.RAINY,
      filename: '/videos/Rainy_CustomerScreen.mp4'
    }
  },
  loadingResults: {
    [WeatherType.SUNNY]: {
      type: 'loading-results',
      weather: WeatherType.SUNNY,
      filename: '/videos/Sunny_LoadingResultsScreen.mp4'
    },
    [WeatherType.WINDY]: {
      type: 'loading-results',
      weather: WeatherType.WINDY,
      filename: '/videos/Windy_LoadingResultsScreen.mp4'
    },
    [WeatherType.RAINY]: {
      type: 'loading-results',
      weather: WeatherType.RAINY,
      filename: '/videos/Rainy_LoadingResultsScreen.mp4'
    }
  },
  results: {
    [WeatherType.SUNNY]: {
      type: 'results',
      weather: WeatherType.SUNNY,
      filename: '/videos/Sunny_ResultsScreen.mp4'
    },
    [WeatherType.WINDY]: {
      type: 'results',
      weather: WeatherType.WINDY,
      filename: '/videos/Windy_ResultsScreen.mp4'
    },
    [WeatherType.RAINY]: {
      type: 'results',
      weather: WeatherType.RAINY,
      filename: '/videos/Rainy_ResultsScreen.mp4'
    }
  },
  leaderboard: {
    'leaderboard-screen': {
      type: 'leaderboard',
      filename: '/videos/LeaderboardScreen.mp4'
    }
  }
};

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  basePath: '/videos',
  preloadStrategy: 'intro',
  autoplay: true,
  controls: false,
  muted: false
};

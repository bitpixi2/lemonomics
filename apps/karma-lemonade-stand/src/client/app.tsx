import React, { useState, useEffect } from 'react';
import { 
  GameState,
  WeatherType
} from '../shared/types/game.js';
import { VideoPlayer } from './components/VideoPlayer.js';
import { VideoPreloader } from './utils/videoPreloader.js';
import { VideoSequencer, GamePhase } from './utils/videoSequencer.js';
import { GameAudio } from './utils/gameAudio.js';
import { AudioControl } from './components/AudioControl.js';
import { IngredientSelection } from './components/IngredientSelection.js';
// VIDEO_ASSETS imported in video components

interface AppState {
  phase: GamePhase;
  gameState?: GameState;
  isLoading: boolean;
  error?: string;
  videoPreloader?: VideoPreloader;
  videoSequencer?: VideoSequencer;
  gameAudio?: GameAudio;
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    phase: 'intro',
    isLoading: true
  });

  // Generate random weather
  const generateRandomWeather = (): WeatherType => {
    const weatherTypes = [WeatherType.SUNNY, WeatherType.WINDY, WeatherType.RAINY];
    const weights = [0.5, 0.3, 0.2]; // 50% sunny, 30% windy, 20% rainy
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weatherTypes.length; i++) {
      cumulative += weights[i] || 0;
      if (random <= cumulative) {
        return weatherTypes[i] || WeatherType.SUNNY;
      }
    }
    
    return WeatherType.SUNNY; // Fallback
  };

  // Initialize video and audio systems
  useEffect(() => {
    const initializeVideoSystems = async () => {
      try {
        const preloader = new VideoPreloader({ 
          preloadStrategy: 'intro',
          muted: false // Allow sound for better experience
        });
        const sequencer = new VideoSequencer();
        
        // Initialize audio system
        const gameAudio = new GameAudio();
        
        // Preload game audio assets
        gameAudio.preloadGameAudio();
        
        console.log('Initializing video systems...');
        
        // Preload intro videos
        await preloader.preloadVideos();
        
        console.log('Video preloading complete. Preload status:', preloader.getPreloadStatus());
        
        // Generate random weather for intro
        const introWeather = generateRandomWeather();
        
        // Start intro sequence
        const introSequence = sequencer.createIntroSequence(introWeather);
        sequencer.startSequence(introSequence);
        
        // Start background music
        gameAudio.playPhaseMusic('intro');
        
        setAppState(prev => ({
          ...prev,
          videoPreloader: preloader,
          videoSequencer: sequencer,
          gameAudio: gameAudio,
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to initialize video systems:', error);
        setAppState(prev => ({
          ...prev,
          error: `Failed to load video assets: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isLoading: false
        }));
      }
    };

    initializeVideoSystems();
  }, []);

  const handleIntroVideoEnd = () => {
    console.log('Intro video ended');
    if (appState.videoSequencer?.shouldAutoAdvance()) {
      // Move to next step or show start button
      const nextStep = appState.videoSequencer.nextStep();
      if (!nextStep) {
        // Sequence complete, show start game button
        setAppState(prev => ({ ...prev, phase: 'intro' }));
      }
    }
  };

  const handleVideoError = (error: Error) => {
    console.error('Video playback error:', error);
    setAppState(prev => ({
      ...prev,
      error: `Video playback failed: ${error.message}`
    }));
  };

  const handleStartGame = async () => {
    if (!appState.videoSequencer || !appState.videoPreloader) return;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Preload weather-specific videos for better experience
      await appState.videoPreloader.preloadWeatherVideos(WeatherType.SUNNY);
      
      // Initialize a basic game state
      const initialGameState: GameState = {
        day: 1,
        cash: 10.00,
        inventory: {
          lemons: 0,
          sugar: 2, // Free sugar from mom
          cups: 0
        },
        weather: WeatherType.SUNNY,
        festival: 'summer' as any, // Will be properly typed in future tasks
        karmaBoost: { multiplier: 1.0, level: 'none', description: 'No bonus', threshold: 0 },
        isFirstDay: true
      };

      // Generate weather for the day
      const dayWeather = generateRandomWeather();
      
      // Start ingredients phase (ingredients video with selection overlay)
      const daySequence = appState.videoSequencer.createDaySequence(dayWeather);
      appState.videoSequencer.startSequence(daySequence);
      
      // Update game state with the day's weather
      const gameStateWithWeather = { ...initialGameState, weather: dayWeather };
      
      setAppState(prev => ({ 
        ...prev, 
        gameState: gameStateWithWeather,
        phase: 'ingredients',
        isLoading: false 
      }));
      
      // Continue background music for ingredients phase
      if (appState.gameAudio) {
        appState.gameAudio.playPhaseMusic('ingredients');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setAppState(prev => ({
        ...prev,
        error: `Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
    }
  };

  // Show loading screen while initializing
  if (appState.isLoading) {
    return (
      <div className="app">
        <div className="loading">🍋 Loading Lemonomics...</div>
        <AudioControl className="audio-control-loading" />
      </div>
    );
  }

  // Show error if video systems failed to initialize
  if (appState.error) {
    return (
      <div className="app">
        <div className="video-error">
          <div className="error-message">{appState.error}</div>
          <button onClick={() => window.location.reload()}>
            Reload Game
          </button>
        </div>
        <AudioControl className="audio-control-error" />
      </div>
    );
  }

  // Intro phase - show ghost intro video
  if (appState.phase === 'intro' && appState.videoPreloader) {
    const currentStep = appState.videoSequencer?.getCurrentStep();
    
    return (
      <div className="app">
        <AudioControl className="audio-control-intro" />
        <div className="intro-screen">
          {currentStep ? (
            <VideoPlayer
              videoAsset={currentStep.video}
              preloader={appState.videoPreloader}
              onVideoEnd={handleIntroVideoEnd}
              onVideoError={handleVideoError}
              className="intro-video"
              autoplay={true}
              controls={false}
              muted={false}
              fadeIn={true}
            />
          ) : (
            <>
              <h1>🍋 Lemonomics</h1>
              <p>A Simple Reddit-Integrated Lemonade Stand Game</p>
              <div className="intro-story">
                <p>Welcome to the classic lemonade stand game! Your mom gives you $10 and 2 free cups of sugar to start. Can you build a successful business?</p>
              </div>
              <button 
                onClick={handleStartGame} 
                className="start-game-button"
                disabled={appState.isLoading}
              >
                {appState.isLoading ? 'Starting...' : 'Start Game'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Ingredients phase - show ingredients video with selection overlay
  if (appState.phase === 'ingredients' && appState.gameState && appState.videoPreloader) {
    const currentStep = appState.videoSequencer?.getCurrentStep();
    
    return (
      <div className="app">
        <AudioControl className="audio-control-ingredients" />
        <div className="video-container">
          {currentStep && (
            <VideoPlayer
              videoAsset={currentStep.video}
              preloader={appState.videoPreloader}
              onVideoError={handleVideoError}
              className="ingredients-video"
              autoplay={true}
              controls={false}
              muted={false}
              loop={currentStep.loop || false}
              fadeIn={currentStep.fadeTransition || false}
            />
          )}
          
          {currentStep?.showUI && (
            <div className="video-overlay interactive">
              <div className="overlay-content">
                <h2>Day {appState.gameState.day} - Plan Your Ingredients</h2>
                <div className="game-info">
                  <p>Cash: ${appState.gameState.cash.toFixed(2)}</p>
                  <p>Weather: {appState.gameState.weather}</p>
                </div>
                <IngredientSelection 
                  gameState={appState.gameState}
                  onPurchase={(ingredients) => {
                    console.log('Purchased ingredients:', ingredients);
                    // TODO: Process purchase and move to next phase
                    setAppState(prev => ({ ...prev, phase: 'intro' }));
                  }}
                  onBack={() => setAppState(prev => ({ ...prev, phase: 'intro' }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="app">
      <div className="loading">Loading game phase...</div>
    </div>
  );
};

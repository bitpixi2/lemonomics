import React, { useState, useEffect } from 'react';
import { GameUI } from './components/game-ui.js';
import { FestivalThemeRenderer } from './components/festival-theme-renderer.js';
import { ResultDisplay } from './components/result-display.js';
import { LeaderboardDisplay } from './components/leaderboard-display.js';
import { audioManager } from './services/audio-manager.js';
import { 
  GameResult, 
  DailyCycle, 
  WeeklyCycle, 
  Leaderboard,
  UserProfile,
  WeatherType,
  MarketEvent
} from '../shared/types/game.js';

interface GameState {
  phase: 'splash' | 'loading' | 'playing' | 'results' | 'leaderboard' | 'complete';
  currentDay: number;
  maxDays: number;
  dayResults: GameResult[];
  totalProfit: number;
  currentCycle?: DailyCycle;
  weeklyFestival?: WeeklyCycle;
  userProfile?: UserProfile;
  gameResult?: GameResult;
  dailyLeaderboard?: Leaderboard;
  weeklyLeaderboard?: Leaderboard;
  isLoading: boolean;
  error: string;
  progressUpdate?: any;
}

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'splash',
    currentDay: 1,
    maxDays: 3,
    dayResults: [],
    totalProfit: 0,
    isLoading: false,
    error: ''
  });

  useEffect(() => {
    // Only initialize audio on startup, don't auto-load game data
    initializeAudio();
    
    // Set up splash screen button handler
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', handleStartGame);
    }
    
    return () => {
      if (startButton) {
        startButton.removeEventListener('click', handleStartGame);
      }
    };
  }, []);

  const handleStartGame = () => {
    // Hide splash screen and show game
    const splash = document.getElementById('splash');
    const gameContainer = document.getElementById('game');
    
    if (splash) splash.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';
    
    // Start loading the game
    setGameState(prev => ({ ...prev, phase: 'loading' }));
    initializeGame();
  };

  const initializeAudio = async () => {
    try {
      // Initialize audio system
      await audioManager.initialize();
      
      // Preload game sounds
      await audioManager.preloadGameSounds();
      
      // Play the lemonade pour sound as a welcome
      setTimeout(() => {
        audioManager.playSound('lemonade-pour', 0.6);
      }, 500);
      
    } catch (error) {
      console.log('Audio initialization failed (this is normal if no audio files are present):', error);
    }
  };

  const initializeGame = async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: '' }));

      // Try to load initial game data, but fallback to mock data if it fails
      try {
        const [cycleResponse, profileResponse] = await Promise.all([
          fetch('/api/current-cycle'),
          fetch('/api/profile')
        ]);

        const cycleData = await cycleResponse.json();
        const profileData = await profileResponse.json();

        if (cycleData.success && profileData.success) {
          setGameState(prev => ({
            ...prev,
            phase: 'playing',
            currentCycle: cycleData.daily,
            weeklyFestival: cycleData.weekly,
            userProfile: profileData.profile,
            isLoading: false
          }));
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }

      // Fallback to mock data for development
      const weatherOptions = [WeatherType.SUNNY, WeatherType.HOT, WeatherType.RAINY];
      const mockCycle: DailyCycle = {
        date: new Date().toISOString().split('T')[0] as string,
        seed: `day-${gameState.currentDay}`,
        weather: weatherOptions[gameState.currentDay - 1] || WeatherType.SUNNY,
        lemonPrice: 0.5,
        sugarPrice: 0.3,
        event: MarketEvent.NONE,
        multipliers: {
          demand: {
            [WeatherType.SUNNY]: 1.2,
            [WeatherType.HOT]: 1.5,
            [WeatherType.CLOUDY]: 1.0,
            [WeatherType.RAINY]: 0.5,
            [WeatherType.COLD]: 0.3
          },
          event: {
            [MarketEvent.NONE]: 1.0,
            [MarketEvent.VIRAL]: 2.0,
            [MarketEvent.SUGAR_SHORT]: 1.0,
            [MarketEvent.INFLATION]: 1.0
          },
          cost: {
            [MarketEvent.NONE]: 1.0,
            [MarketEvent.VIRAL]: 1.0,
            [MarketEvent.SUGAR_SHORT]: 1.5,
            [MarketEvent.INFLATION]: 1.3
          }
        },
        loginBonus: 'NONE' as any
      };

      const mockProfile: UserProfile = {
        userId: 'mock-user',
        username: 'TestUser',
        redditStats: {
          postKarma: 100,
          commentKarma: 200,
          accountAgeDays: 365,
          awards: 5,
          lastUpdated: new Date()
        },
        gameStats: {
          service: 1,
          marketing: 1,
          reputation: 1
        },
        progress: {
          totalRuns: 0,
          currentStreak: 0,
          longestStreak: 0,
          bestProfit: 0,
          totalProfit: 0
        },
        powerups: {
          usedToday: {},
          lastResetDate: new Date().toISOString().split('T')[0] as string
        }
      };

      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentCycle: mockCycle,
        userProfile: mockProfile,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to initialize game:', error);
      setGameState(prev => ({
        ...prev,
        error: 'Failed to load game. Please refresh and try again.',
        isLoading: false
      }));
    }
  };

  const handleRunGame = async (price: number, adSpend: number, standData?: any) => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));

      // Try API first, fallback to mock calculation
      try {
        const response = await fetch('/api/run-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ price, adSpend })
        });

        const data = await response.json();

        if (data.success) {
          setGameState(prev => ({
            ...prev,
            phase: 'results',
            gameResult: data.result,
            progressUpdate: data.progress,
            userProfile: data.updatedProfile,
            isLoading: false
          }));
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock calculation');
      }

      // Classic Lemonade Stand Logic
      const weather = gameState.currentCycle?.weather || WeatherType.SUNNY;
      const event = gameState.currentCycle?.event || MarketEvent.NONE;
      
      if (standData) {
        // Use classic lemonade stand calculation
        const { glasses, signs, priceInCents, totalCost } = standData;
        
        // Calculate demand based on classic BASIC game logic
        const optimalPrice = 10; // 10 cents is optimal
        const baseCustomers = 30;
        
        let demandMultiplier;
        if (priceInCents >= optimalPrice) {
          // Higher prices reduce demand exponentially
          demandMultiplier = (optimalPrice * optimalPrice) * baseCustomers / (priceInCents * priceInCents);
        } else {
          // Lower prices increase demand linearly
          demandMultiplier = (optimalPrice - priceInCents) / optimalPrice * 0.8 * baseCustomers + baseCustomers;
        }
        
        // Weather effects
        let weatherMultiplier = 1.0;
        if (weather === WeatherType.SUNNY) weatherMultiplier = 1.2;
        if (weather === WeatherType.HOT) weatherMultiplier = 1.5;
        if (weather === WeatherType.RAINY) weatherMultiplier = 0.5;
        if (weather === WeatherType.COLD) weatherMultiplier = 0.3;
        
        // Advertising effect (diminishing returns)
        const adEffect = -signs * 0.5;
        const adMultiplier = 1 - (Math.exp(adEffect) * 1);
        
        // Calculate final demand
        let totalDemand = weatherMultiplier * (demandMultiplier + (demandMultiplier * adMultiplier));
        totalDemand = Math.floor(Math.max(0, totalDemand));
        
        // Can't sell more than you made
        const glassesSold = Math.min(totalDemand, glasses);
        
        // Calculate financials
        const revenue = glassesSold * (priceInCents / 100);
        const profit = revenue - totalCost;
        
        const mockResult: GameResult = {
          profit: Math.round(profit * 100) / 100,
          cupsSold: glassesSold,
          weather,
          event,
          festival: 'default',
          streak: gameState.currentDay,
          seed: `day-${gameState.currentDay}`,
          powerupsApplied: []
        };
        
        const newDayResults = [...gameState.dayResults, mockResult];
        const newTotalProfit = gameState.totalProfit + mockResult.profit;

        setGameState(prev => ({
          ...prev,
          phase: 'results',
          gameResult: mockResult,
          dayResults: newDayResults,
          totalProfit: newTotalProfit,
          isLoading: false
        }));
        
        return;
      }
      
      // Fallback simple calculation if no standData
      let baseDemand = 100;
      if (weather === WeatherType.SUNNY) baseDemand *= 1.2;
      if (weather === WeatherType.HOT) baseDemand *= 1.5;
      if (weather === WeatherType.RAINY) baseDemand *= 0.5;
      if (price > 2) baseDemand *= 0.7;
      if (price < 1) baseDemand *= 1.3;
      
      const adBoost = Math.min(adSpend / 10, 2);
      const finalDemand = Math.floor(baseDemand * (1 + adBoost));
      
      const revenue = finalDemand * price;
      const costs = finalDemand * 0.3 + adSpend;
      const profit = revenue - costs;

      const mockResult: GameResult = {
        profit: Math.round(profit * 100) / 100,
        cupsSold: finalDemand,
        weather,
        event,
        festival: 'default',
        streak: gameState.userProfile?.progress.currentStreak || 0,
        seed: 'mock-seed',
        powerupsApplied: []
      };

      const newDayResults = [...gameState.dayResults, mockResult];
      const newTotalProfit = gameState.totalProfit + mockResult.profit;

      setGameState(prev => ({
        ...prev,
        phase: 'results',
        gameResult: mockResult,
        dayResults: newDayResults,
        totalProfit: newTotalProfit,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to run game:', error);
      setGameState(prev => ({
        ...prev,
        error: 'Failed to run your lemonade stand. Please try again.',
        isLoading: false
      }));
    }
  };

  const handlePlayAgain = () => {
    if (gameState.currentDay < gameState.maxDays) {
      // Move to next day and update conditions
      const nextDay = gameState.currentDay + 1;
      const weatherOptions = [WeatherType.SUNNY, WeatherType.HOT, WeatherType.RAINY];
      
      const updatedCycle: DailyCycle = {
        ...gameState.currentCycle!,
        weather: weatherOptions[nextDay - 1] || WeatherType.SUNNY,
        seed: `day-${nextDay}`,
        date: new Date().toISOString().split('T')[0] as string
      };

      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentDay: nextDay,
        currentCycle: updatedCycle
      }));
    } else {
      // All days complete, show completion screen
      setGameState(prev => ({
        ...prev,
        phase: 'complete'
      }));
    }
  };

  const handleShowLeaderboard = async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/leaderboards');
      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to load leaderboards');
      }

      setGameState(prev => ({
        ...prev,
        phase: 'leaderboard',
        dailyLeaderboard: data.daily,
        weeklyLeaderboard: data.weekly,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to load leaderboards:', error);
      setGameState(prev => ({
        ...prev,
        error: 'Failed to load leaderboards.',
        isLoading: false
      }));
    }
  };

  const handleBackToGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'playing'
    }));
  };

  const handleShare = async () => {
    if (!gameState.gameResult) return;

    try {
      const response = await fetch('/api/share-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          result: gameState.gameResult,
          progress: gameState.progressUpdate 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message or redirect to shared post
        console.log('Result shared successfully!');
      }

    } catch (error) {
      console.error('Failed to share result:', error);
    }
  };

  if (gameState.error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Oops! Something went wrong</h2>
          <p>{gameState.error}</p>
          <button onClick={initializeGame} className="retry-button">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (gameState.isLoading && gameState.phase === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-icon">🍋</div>
          <h2>Loading Karma Lemonade Stand...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const festivalWrapper = gameState.weeklyFestival ? (
    <FestivalThemeRenderer festival={gameState.weeklyFestival}>
      {renderGameContent()}
    </FestivalThemeRenderer>
  ) : (
    <div className="default-theme">
      {renderGameContent()}
    </div>
  );

  return (
    <div className="app">
      {festivalWrapper}
    </div>
  );

  function renderGameContent() {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1>🍋 Karma Lemonade Stand</h1>
          <p>Turn your Reddit karma into sweet profits!</p>
          
          <nav className="game-nav">
            <button 
              onClick={handleBackToGame}
              className={gameState.phase === 'playing' ? 'active' : ''}
            >
              🎮 Play
            </button>
            <button 
              onClick={handleShowLeaderboard}
              className={gameState.phase === 'leaderboard' ? 'active' : ''}
            >
              🏆 Leaderboards
            </button>
          </nav>
        </header>

        <main className="game-main">
          {gameState.phase === 'playing' && (
            <GameUI
              onRunGame={handleRunGame}
              currentCycle={gameState.currentCycle}
              weeklyFestival={gameState.weeklyFestival}
              isLoading={gameState.isLoading}
              currentDay={gameState.currentDay}
              maxDays={gameState.maxDays}
            />
          )}

          {gameState.phase === 'results' && gameState.gameResult && (
            <ResultDisplay
              result={gameState.gameResult}
              onPlayAgain={handlePlayAgain}
              onShare={handleShare}
              currentDay={gameState.currentDay}
              maxDays={gameState.maxDays}
              dayResults={gameState.dayResults}
              totalProfit={gameState.totalProfit}
            />
          )}

          {gameState.phase === 'leaderboard' && (
            <LeaderboardDisplay
              dailyLeaderboard={gameState.dailyLeaderboard}
              weeklyLeaderboard={gameState.weeklyLeaderboard}
            />
          )}

          {gameState.phase === 'complete' && (
            <div className="completion-screen">
              <div className="completion-content">
                <h2>🎉 3-Day Challenge Complete!</h2>
                <div className="final-summary">
                  <div className="total-profit">
                    <span className="label">Total Profit:</span>
                    <span className="amount">${gameState.totalProfit.toFixed(2)}</span>
                  </div>
                  
                  <div className="daily-breakdown">
                    <h3>Daily Results:</h3>
                    {gameState.dayResults.map((result, index) => (
                      <div key={index} className="day-summary">
                        <span>Day {index + 1}:</span>
                        <span>${result.profit.toFixed(2)}</span>
                        <span>({result.cupsSold} cups)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="comeback-message">
                  <h3>🗓️ Come Back Tomorrow!</h3>
                  <p>Return tomorrow for Day 4 and keep your streak alive!</p>
                  <p>Your progress has been saved.</p>
                </div>
                
                <div className="completion-actions">
                  <button onClick={handleShowLeaderboard} className="leaderboard-button">
                    🏆 View Leaderboards
                  </button>
                  <button onClick={handleShare} className="share-button">
                    📱 Share Results
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }
};

import React, { useState, useEffect, useRef } from 'react';

interface GameState {
  day: number;
  cash: number;
  glasses: number;
  signs: number;
  price: number;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'hot';
  assets: number;
  bankrupt: boolean;
}

interface KarmaBoost {
  multiplier: number;
  level: string;
  description: string;
  totalKarma: number;
}

interface FlairReward {
  day: number;
  flairId: string;
  name: string;
  description: string;
}

interface FlairCheckResponse {
  type: 'flair-check';
  awarded: boolean;
  flair?: FlairReward;
  message: string;
}

interface DayResult {
  glassesSold: number;
  income: number;
  expenses: number;
  profit: number;
  specialEvent?: string;
}

type GamePhase = 'intro' | 'dayBriefing' | 'setup' | 'results' | 'gameOver';

export const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState>({
    day: 0,
    cash: 2.0,
    glasses: 0,
    signs: 0,
    price: 0,
    weather: 'sunny',
    assets: 2.0,
    bankrupt: false,
  });
  const [dayResult, setDayResult] = useState<DayResult | null>(null);
  const [inputs, setInputs] = useState({
    glasses: '',
    sugar: '',
    signs: '',
    price: '',
  });
  const [karmaBoost, setKarmaBoost] = useState<KarmaBoost>({
    multiplier: 1.0,
    level: 'none',
    description: 'Loading karma boost...',
    totalKarma: 0,
  });
  const [flairNotification, setFlairNotification] = useState<FlairCheckResponse | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchKarmaBoost = async () => {
    try {
      const response = await fetch('/api/karma-boost');
      if (response.ok) {
        const data = await response.json();
        setKarmaBoost(data);
      }
    } catch (error) {
      console.error('Failed to fetch karma boost:', error);
    }
  };

  const checkForFlairReward = async (currentDay: number) => {
    try {
      const response = await fetch('/api/check-flair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentDay }),
      });

      if (response.ok) {
        const data: FlairCheckResponse = await response.json();
        if (data.awarded) {
          setFlairNotification(data);
        }
      }
    } catch (error) {
      console.error('Failed to check flair reward:', error);
    }
  };

  // Audio initialization and control
  useEffect(() => {
    const tryAudioPaths = [
      './lemonomics-theme-music.mp3',
      '/lemonomics-theme-music.mp3',
      '/media/lemonomics-theme-music.mp3',
      '/assets/lemonomics-theme-music.mp3',
      '../assets/lemonomics-theme-music.mp3'
    ];
    
    let currentPathIndex = 0;
    
    const tryNextPath = () => {
      if (currentPathIndex >= tryAudioPaths.length) {
        console.error('All audio paths failed');
        return;
      }
      
      const path = tryAudioPaths[currentPathIndex];
      console.log(`Trying audio path: ${path}`);
      
      audioRef.current = new Audio(path);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      audioRef.current.addEventListener('canplay', () => {
        console.log(`Audio loaded successfully from: ${path}`);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error(`Audio failed to load from: ${path}`, e);
        currentPathIndex++;
        tryNextPath();
      });
    };
    
    tryNextPath();

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(console.error);
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const startAudio = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(console.error);
    }
  };

  const startGame = async () => {
    await fetchKarmaBoost();
    setGameState({
      day: 1,
      cash: 2.0,
      glasses: 0,
      signs: 0,
      price: 0,
      weather: generateWeather(),
      assets: 2.0,
      bankrupt: false,
    });
    setPhase('dayBriefing');
    // Start the theme music when the game begins
    startAudio();
  };

  const generateWeather = (): 'sunny' | 'cloudy' | 'rainy' | 'hot' => {
    const rand = Math.random();
    if (rand < 0.6) return 'sunny';
    if (rand < 0.8) return 'cloudy';
    if (rand < 0.9) return 'rainy';
    return 'hot';
  };

  const getLemonCost = (day: number): number => {
    if (day <= 2) return 0.02;
    if (day <= 6) return 0.04;
    return 0.05;
  };

  const calculateSales = (
    glasses: number,
    sugar: number,
    signs: number,
    price: number,
    weather: string
  ): DayResult => {
    const lemonCost = getLemonCost(gameState.day);

    // Base demand calculation (from original BASIC)
    let demand = 30; // Base customers

    // Weather effects
    if (weather === 'hot') demand *= 2;
    if (weather === 'rainy') demand *= 0.3;
    if (weather === 'cloudy') demand *= 0.7;

    // Price effects (from original formula)
    let priceEffect = 1;
    if (price >= 10) {
      priceEffect = (10 * 10 * 30) / (price * price);
    } else {
      priceEffect = ((10 - price) / 10) * 0.8 * 30 + 30;
    }

    // Sign effects (advertising)
    const signEffect = 1 - Math.exp(-signs * 0.5);

    // Sugar quality effects (after day 3)
    let sugarQuality = 1;
    if (gameState.day >= 3 && glasses > 0) {
      const sugarRatio = sugar / glasses;
      if (sugarRatio >= 1) {
        sugarQuality = 1; // Perfect sweetness
      } else if (sugarRatio >= 0.5) {
        sugarQuality = 0.8; // Slightly less sweet
      } else if (sugarRatio > 0) {
        sugarQuality = 0.6; // Not sweet enough
      } else {
        sugarQuality = 0.4; // No sugar - very poor quality
      }
    }

    // Apply karma boost to demand
    const karmaMultiplier = karmaBoost.multiplier;

    // Calculate final demand with karma boost and sugar quality
    const finalDemand = Math.floor(
      demand * (priceEffect / 30) * (1 + signEffect) * karmaMultiplier * sugarQuality
    );

    // Can't sell more than you made
    const glassesSold = Math.min(finalDemand, glasses);

    const income = glassesSold * (price / 100);
    const expenses = glasses * lemonCost + signs * 0.15;
    const profit = income - expenses;

    return {
      glassesSold,
      income,
      expenses,
      profit,
    };
  };

  const playDay = () => {
    const glasses = parseInt(inputs.glasses) || 0;
    const sugar = parseInt(inputs.sugar) || 0;
    const signs = parseInt(inputs.signs) || 0;
    const price = parseInt(inputs.price) || 0;

    const lemonCost = getLemonCost(gameState.day);
    const sugarCost = gameState.day >= 3 ? 0.02 : 0; // 2¢ per unit after day 3
    const totalCost = glasses * lemonCost + sugar * sugarCost + signs * 0.15;

    // Sugar is optional but recommended after day 3
    // Allow players to make lemonade with less sugar (affects quality but doesn't block)
    if (gameState.day >= 3 && glasses > 0 && sugar === 0) {
      const proceed = confirm(
        `Warning: Making ${glasses} glasses without sugar will result in poor quality lemonade and fewer sales. Continue anyway?`
      );
      if (!proceed) {
        return;
      }
    }

    // Validate inputs
    if (totalCost > gameState.cash) {
      alert(
        `You don't have enough money! You need $${totalCost.toFixed(2)} but only have $${gameState.cash.toFixed(2)}`
      );
      return;
    }

    // Additional check for negative cash
    if (gameState.cash <= 0) {
      alert('You have no money left! Game Over.');
      setGameState((prev) => ({ ...prev, bankrupt: true }));
      setPhase('gameOver');
      return;
    }

    if (glasses < 0 || glasses > 1000) {
      alert('Please enter a reasonable number of glasses (0-1000)');
      return;
    }

    if (signs < 0 || signs > 50) {
      alert('Please enter a reasonable number of signs (0-50)');
      return;
    }

    if (price < 0 || price > 100) {
      alert('Please enter a reasonable price (0-100 cents)');
      return;
    }

    // Check for special events (from original game)
    let specialEvent = '';
    let eventMultiplier = 1;

    if (gameState.day === 3) {
      specialEvent = '(Your mother quit giving you free sugar)';
    }

    if (gameState.day === 7) {
      specialEvent = '(The price of lemonade mix just went up)';
    }

    // Random events after day 2
    if (gameState.day > 2 && Math.random() < 0.25) {
      const eventRoll = Math.random();
      if (eventRoll < 0.33) {
        specialEvent =
          'The street department is working today. There will be no traffic on your street.';
        eventMultiplier = 0.1;
      } else if (eventRoll < 0.66 && gameState.weather === 'cloudy') {
        specialEvent = 'A severe thunderstorm hit Lemonsville! Everything was ruined!!';
        eventMultiplier = 0;
      }
    }

    const result = calculateSales(glasses, sugar, signs, price, gameState.weather);

    // Apply special event effects
    const adjustedResult = {
      ...result,
      glassesSold: Math.floor(result.glassesSold * eventMultiplier),
      income: result.income * eventMultiplier,
    };

    adjustedResult.profit = adjustedResult.income - result.expenses;

    const newCash = gameState.cash + adjustedResult.profit;
    const newAssets = newCash;

    // Check bankruptcy: can't afford minimum lemonade for next day OR negative cash
    const nextDayLemonCost = getLemonCost(gameState.day + 1);
    const isBankrupt = newCash < nextDayLemonCost || newCash < 0;

    setDayResult({ ...adjustedResult, specialEvent });
    setGameState((prev) => ({
      ...prev,
      cash: newCash,
      assets: newAssets,
      glasses,
      signs,
      price,
      bankrupt: isBankrupt,
    }));

    setPhase('results');
  };

  const nextDay = async () => {
    if (gameState.bankrupt) {
      setPhase('gameOver');
      return;
    }

    // Classic game ending conditions
    if (gameState.day >= 30) {
      // Check for final flair reward before ending
      await checkForFlairReward(gameState.day);
      setPhase('gameOver');
      return;
    }

    const nextDayNumber = gameState.day + 1;

    // Check for flair rewards at milestone days
    if (nextDayNumber === 10 || nextDayNumber === 20 || nextDayNumber === 30) {
      await checkForFlairReward(nextDayNumber);
    }

    setGameState((prev) => ({
      ...prev,
      day: nextDayNumber,
      weather: generateWeather(),
    }));

    setInputs({ glasses: '', sugar: '', signs: '', price: '' });
    setPhase('dayBriefing');
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return '☀️';
      case 'hot':
        return '🔥';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      default:
        return '☀️';
    }
  };

  const getWeatherDescription = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return 'Nice sunny day - good for lemonade sales!';
      case 'hot':
        return 'Hot weather - people will be very thirsty!';
      case 'cloudy':
        return 'Cloudy day - fewer people might be out.';
      case 'rainy':
        return 'Rainy day - not many customers expected.';
      default:
        return 'Pleasant weather for lemonade!';
    }
  };

  // Audio control button
  const AudioControlButton = () => (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-40 bg-white/90 hover:bg-white border-2 border-yellow-400 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
      title={isMuted ? 'Unmute music' : 'Mute music'}
    >
      {isMuted ? (
        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
          <path d="M3 3l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );

  // Flair notification modal
  const FlairNotificationModal = () => {
    if (!flairNotification) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Achievement Unlocked!</h2>
          {flairNotification.flair && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {flairNotification.flair.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{flairNotification.flair.description}</p>
            </div>
          )}
          <p className="text-gray-700 mb-6">{flairNotification.message}</p>
          <button
            onClick={() => setFlairNotification(null)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    );
  };

  if (phase === 'intro') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-yellow-200 to-yellow-400 flex items-center justify-center p-4">
          <AudioControlButton />
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h1 className="text-4xl font-bold text-yellow-600 mb-4">🍋 Lemonomics</h1>
            <p className="text-gray-700 mb-4">
              Welcome to the classic lemonade stand business game! Start with $2.00 and try to build
              your lemonade empire.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Based on the original 1979 Apple Computer game
            </p>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-6">
              <p className="text-sm text-blue-800 font-semibold">🎯 Reddit Karma Boosts:</p>
              <p className="text-xs text-blue-700">
                • 300+ karma: 1.15x sales boost
                <br />
                • 1,000+ karma: 1.5x sales boost
                <br />• 5,000+ karma: 2x sales boost
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded mb-6">
              <p className="text-sm text-purple-800 font-semibold">🏆 Achievement Rewards:</p>
              <p className="text-xs text-purple-700">
                • Day 10: 🍋 Lemon Apprentice flair
                <br />
                • Day 20: 🤑 Citrus Tycoon flair
                <br />• Day 30: 🌍 Global Lemonade Hero flair
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Exclusive flair awarded in r/Lemonomics!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              Start Your Stand! 🍋
            </button>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'dayBriefing') {
    const lemonCost = getLemonCost(gameState.day);

    // Special day messages
    let specialMessage = '';
    if (gameState.day === 3) {
      specialMessage = '📢 Your mother quit giving you free sugar!';
    } else if (gameState.day === 7) {
      specialMessage = '📢 The price of lemonade mix just went up!';
    }

    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-purple-200 to-blue-200 p-4 flex items-center justify-center">
          <AudioControlButton />
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 text-center">
              {/* Day Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-purple-700 mb-2">Day {gameState.day}</h1>
                <div className="text-6xl mb-4">{getWeatherIcon(gameState.weather)}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {gameState.weather.charAt(0).toUpperCase() + gameState.weather.slice(1)} Weather
                </h2>
                <p className="text-gray-600">{getWeatherDescription(gameState.weather)}</p>
              </div>

              {/* Special Events */}
              {specialMessage && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
                  <p className="font-semibold">{specialMessage}</p>
                </div>
              )}

              {/* Business Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Today's Business Conditions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>💰 Your Assets:</span>
                    <span className="font-semibold text-green-600">
                      ${gameState.assets.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🍋 Lemon Mix Cost:</span>
                    <span>${lemonCost.toFixed(2)} per glass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📢 Sign Cost:</span>
                    <span>$0.15 each</span>
                  </div>
                  {karmaBoost.level !== 'none' && (
                    <div className="flex justify-between">
                      <span>🎯 Reddit Karma Boost:</span>
                      <span className="font-semibold text-blue-600">
                        {karmaBoost.multiplier}x sales!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setPhase('setup')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
              >
                Make Business Decisions 📊
              </button>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'setup') {
    const lemonCost = getLemonCost(gameState.day);

    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-blue-200 to-green-200 p-2 flex items-center justify-center">
          <AudioControlButton />
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-4">
              {/* Header - Simple */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-green-700">🏪 Set Up Your Stand</h2>
                <p className="text-sm text-gray-600">
                  Day {gameState.day} • ${gameState.assets.toFixed(2)} available
                </p>
              </div>

              {/* Inputs - Dynamic Layout Based on Day */}
              <div className="space-y-3">
                {gameState.day >= 3 ? (
                  // After day 3: 4-column grid with sugar
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Glasses
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={inputs.glasses}
                        onChange={(e) =>
                          setInputs((prev) => ({ ...prev, glasses: e.target.value }))
                        }
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sugar (2¢)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={inputs.sugar}
                        onChange={(e) => setInputs((prev) => ({ ...prev, sugar: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Signs</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={inputs.signs}
                        onChange={(e) => setInputs((prev) => ({ ...prev, signs: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price (¢)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.price}
                        onChange={(e) => setInputs((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                  </div>
                ) : (
                  // Before day 3: 3-column grid without sugar
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Glasses
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={inputs.glasses}
                        onChange={(e) =>
                          setInputs((prev) => ({ ...prev, glasses: e.target.value }))
                        }
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Signs</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={inputs.signs}
                        onChange={(e) => setInputs((prev) => ({ ...prev, signs: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price (¢)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.price}
                        onChange={(e) => setInputs((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                  </div>
                )}

                {/* Cost Preview & Budget Check */}
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600">
                        <strong>Total Cost:</strong> $
                        {(
                          (parseInt(inputs.glasses) || 0) * lemonCost +
                          (parseInt(inputs.sugar) || 0) * (gameState.day >= 3 ? 0.02 : 0) +
                          (parseInt(inputs.signs) || 0) * 0.15
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`${
                          gameState.assets -
                            ((parseInt(inputs.glasses) || 0) * lemonCost +
                              (parseInt(inputs.signs) || 0) * 0.15) <
                          0
                            ? 'text-red-600 font-semibold'
                            : 'text-green-600'
                        }`}
                      >
                        <strong>Remaining:</strong> $
                        {(
                          gameState.assets -
                          ((parseInt(inputs.glasses) || 0) * lemonCost +
                            (parseInt(inputs.sugar) || 0) * (gameState.day >= 3 ? 0.02 : 0) +
                            (parseInt(inputs.signs) || 0) * 0.15)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={playDay}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
                >
                  Open Your Stand! 🏪
                </button>
              </div>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'results' && dayResult) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-green-200 to-blue-200 p-4">
          <AudioControlButton />
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-center mb-6">
                📊 Daily Report - Day {gameState.day}
              </h2>

              {dayResult.specialEvent && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
                  <p className="font-semibold">📰 Special Event:</p>
                  <p>{dayResult.specialEvent}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg mb-3">Lemonade Stand Results</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>{dayResult.glassesSold}</strong> glasses sold
                    </p>
                    <p>
                      <strong>${(gameState.price / 100).toFixed(2)}</strong> per glass
                    </p>
                    <p>
                      <strong>{gameState.glasses}</strong> glasses made
                    </p>
                    <p>
                      <strong>{gameState.signs}</strong> signs made
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      <strong>Income:</strong> ${dayResult.income.toFixed(2)}
                    </p>
                    <p>
                      <strong>Expenses:</strong> ${dayResult.expenses.toFixed(2)}
                    </p>
                    <p
                      className={`font-bold ${dayResult.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      <strong>Profit:</strong> ${dayResult.profit.toFixed(2)}
                    </p>
                    <p>
                      <strong>Assets:</strong> ${gameState.assets.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {gameState.bankrupt ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p className="font-bold">💸 You're bankrupt!</p>
                  <p>You don't have enough money to continue in business.</p>
                </div>
              ) : null}

              <button
                onClick={nextDay}
                className={`w-full font-bold py-3 px-6 rounded-lg ${
                  gameState.bankrupt
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {gameState.bankrupt ? 'Game Over 😢' : `Continue to Day ${gameState.day + 1} ➡️`}
              </button>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'gameOver') {
    const isWinner = gameState.day >= 30 && !gameState.bankrupt;
    const getPerformanceRating = (assets: number) => {
      if (assets >= 100) return '🏆 Lemonade Tycoon!';
      if (assets >= 50) return '💰 Business Success!';
      if (assets >= 20) return '📈 Good Entrepreneur!';
      if (assets >= 10) return '👍 Not Bad!';
      if (assets >= 5) return '😐 Could Be Better';
      return '😅 Better Luck Next Time';
    };

    return (
      <>
        <div
          className={`min-h-screen bg-gradient-to-b ${isWinner ? 'from-green-200 to-yellow-200' : 'from-red-200 to-gray-300'} flex items-center justify-center p-4`}
        >
          <AudioControlButton />
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h1
              className={`text-3xl font-bold mb-4 ${isWinner ? 'text-green-600' : 'text-red-600'}`}
            >
              {isWinner ? '🎉 Congratulations!' : '💸 Game Over'}
            </h1>

            {isWinner ? (
              <div>
                <p className="text-gray-700 mb-4">
                  You successfully ran your lemonade stand for 30 days!
                </p>
                <p className="text-lg font-semibold mb-2">
                  Final Assets: ${gameState.assets.toFixed(2)}
                </p>
                <p className="text-xl font-bold text-green-600 mb-6">
                  {getPerformanceRating(gameState.assets)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">
                  {gameState.bankrupt
                    ? 'You went bankrupt!'
                    : `You lasted ${gameState.day} day${gameState.day !== 1 ? 's' : ''} in the lemonade business!`}
                </p>
                <p className="text-lg font-semibold mb-6">
                  Final Assets: ${gameState.assets.toFixed(2)}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setPhase('intro');
                setGameState({
                  day: 0,
                  cash: 2.0,
                  glasses: 0,
                  signs: 0,
                  price: 0,
                  weather: 'sunny',
                  assets: 2.0,
                  bankrupt: false,
                });
                setDayResult(null);
                setFlairNotification(null);
                // Stop audio when returning to intro
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Play Again 🔄
            </button>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  return null;
};

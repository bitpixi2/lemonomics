import React, { useState, useEffect } from 'react';

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

interface DayResult {
  glassesSold: number;
  income: number;
  expenses: number;
  profit: number;
  specialEvent?: string;
}

type GamePhase = 'intro' | 'setup' | 'results' | 'gameOver';

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
    signs: '',
    price: '',
  });
  const [karmaBoost, setKarmaBoost] = useState<KarmaBoost>({
    multiplier: 1.0,
    level: 'none',
    description: 'Loading karma boost...',
    totalKarma: 0,
  });

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
    setPhase('setup');
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

    // Apply karma boost to demand
    const karmaMultiplier = karmaBoost.multiplier;

    // Calculate final demand with karma boost
    const finalDemand = Math.floor(
      demand * (priceEffect / 30) * (1 + signEffect) * karmaMultiplier
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
    const signs = parseInt(inputs.signs) || 0;
    const price = parseInt(inputs.price) || 0;

    const lemonCost = getLemonCost(gameState.day);
    const totalCost = glasses * lemonCost + signs * 0.15;

    // Validate inputs
    if (totalCost > gameState.cash) {
      alert(
        `You don't have enough money! You need $${totalCost.toFixed(2)} but only have $${gameState.cash.toFixed(2)}`
      );
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

    const result = calculateSales(glasses, signs, price, gameState.weather);

    // Apply special event effects
    const adjustedResult = {
      ...result,
      glassesSold: Math.floor(result.glassesSold * eventMultiplier),
      income: result.income * eventMultiplier,
    };

    adjustedResult.profit = adjustedResult.income - result.expenses;

    const newCash = gameState.cash + adjustedResult.profit;
    const newAssets = newCash;

    setDayResult({ ...adjustedResult, specialEvent });
    setGameState((prev) => ({
      ...prev,
      cash: newCash,
      assets: newAssets,
      glasses,
      signs,
      price,
      bankrupt: newCash < getLemonCost(prev.day + 1),
    }));

    setPhase('results');
  };

  const nextDay = () => {
    if (gameState.bankrupt) {
      setPhase('gameOver');
      return;
    }

    // Classic game ending conditions
    if (gameState.day >= 30) {
      setPhase('gameOver');
      return;
    }

    setGameState((prev) => ({
      ...prev,
      day: prev.day + 1,
      weather: generateWeather(),
    }));

    setInputs({ glasses: '', signs: '', price: '' });
    setPhase('setup');
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

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-200 to-yellow-400 flex items-center justify-center p-4">
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
              • 1,000+ karma: 1.3x sales boost
              <br />• 5,000+ karma: 1.5x sales boost
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
    );
  }

  if (phase === 'setup') {
    const lemonCost = getLemonCost(gameState.day);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-200 to-green-200 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
            <h2 className="text-2xl font-bold text-center mb-4">Day {gameState.day}</h2>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{getWeatherIcon(gameState.weather)}</div>
              <p className="text-gray-700">{getWeatherDescription(gameState.weather)}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded mb-4">
              <p className="font-semibold">Your Assets: ${gameState.assets.toFixed(2)}</p>
              <p>Cost of lemonade mix: ${lemonCost.toFixed(2)} per glass</p>
              <p>Cost of advertising signs: $0.15 each</p>
            </div>

            {karmaBoost.level !== 'none' && (
              <div className="bg-blue-100 border border-blue-400 p-4 rounded mb-4">
                <p className="font-semibold text-blue-800">🎯 Reddit Karma Boost Active!</p>
                <p className="text-blue-700">{karmaBoost.description}</p>
                <p className="text-sm text-blue-600">
                  Total Karma: {karmaBoost.totalKarma.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4">Set up your lemonade stand:</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How many glasses of lemonade do you want to make?
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={inputs.glasses}
                  onChange={(e) => setInputs((prev) => ({ ...prev, glasses: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter number of glasses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How many advertising signs do you want to make? (15¢ each)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={inputs.signs}
                  onChange={(e) => setInputs((prev) => ({ ...prev, signs: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter number of signs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What price (in cents) do you want to charge per glass?
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputs.price}
                  onChange={(e) => setInputs((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter price in cents"
                />
              </div>

              <button
                onClick={playDay}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Open Your Stand! 🏪
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && dayResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-blue-200 p-4">
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
      <div
        className={`min-h-screen bg-gradient-to-b ${isWinner ? 'from-green-200 to-yellow-200' : 'from-red-200 to-gray-300'} flex items-center justify-center p-4`}
      >
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h1 className={`text-3xl font-bold mb-4 ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
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
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            Play Again 🔄
          </button>
        </div>
      </div>
    );
  }

  return null;
};

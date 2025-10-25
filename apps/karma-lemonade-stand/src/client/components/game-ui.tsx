import React, { useState } from 'react';
import { WeatherType, MarketEvent, DailyCycle, WeeklyCycle } from '../../shared/types/game.js';

interface LemonadeStandData {
  lemons: number;
  sugar: number;
  glasses: number;
  signs: number;
  priceInCents: number;
  totalCost: number;
}

interface GameUIProps {
  onRunGame: (price: number, adSpend: number, standData?: LemonadeStandData) => void;
  currentCycle?: DailyCycle;
  weeklyFestival?: WeeklyCycle;
  isLoading?: boolean;
  currentDay: number;
  maxDays: number;
}

export const GameUI = ({ 
  onRunGame, 
  currentCycle, 
  weeklyFestival, 
  isLoading = false,
  currentDay,
  maxDays
}: GameUIProps) => {
  // Classic lemonade stand inputs
  const [lemons, setLemons] = useState(10);        // How many lemons to buy
  const [sugar, setSugar] = useState(5);           // How many cups of sugar to buy  
  const [glasses, setGlasses] = useState(20);      // How many glasses to make
  const [signs, setSigns] = useState(2);           // How many advertising signs to make
  const [priceInCents, setPriceInCents] = useState(10); // Price per glass in cents

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total costs
    const lemonCost = lemons * (currentCycle?.lemonPrice || 0.05);
    const sugarCost = sugar * (currentCycle?.sugarPrice || 0.03);
    const signCost = signs * 0.15; // 15 cents per sign
    const totalCost = lemonCost + sugarCost + signCost;
    
    // Validate we can make the glasses with ingredients
    const maxGlassesFromLemons = lemons * 2; // 2 glasses per lemon
    const maxGlassesFromSugar = sugar * 4;   // 4 glasses per cup of sugar
    const maxGlasses = Math.min(maxGlassesFromLemons, maxGlassesFromSugar);
    
    if (glasses > maxGlasses) {
      alert(`You can only make ${maxGlasses} glasses with ${lemons} lemons and ${sugar} cups of sugar!`);
      return;
    }
    
    // Pass the classic lemonade stand data
    onRunGame(priceInCents / 100, 0, {
      lemons,
      sugar, 
      glasses,
      signs,
      priceInCents,
      totalCost
    });
  };

  const getWeatherIcon = (weather: WeatherType) => {
    switch (weather) {
      case WeatherType.SUNNY: return '☀️';
      case WeatherType.HOT: return '🔥';
      case WeatherType.CLOUDY: return '☁️';
      case WeatherType.RAINY: return '🌧️';
      case WeatherType.COLD: return '❄️';
      default: return '🌤️';
    }
  };

  const getEventIcon = (event: MarketEvent) => {
    switch (event) {
      case MarketEvent.VIRAL: return '📱';
      case MarketEvent.SUGAR_SHORT: return '⚠️';
      case MarketEvent.INFLATION: return '📈';
      default: return '';
    }
  };

  const getEventDescription = (event: MarketEvent) => {
    switch (event) {
      case MarketEvent.VIRAL: return 'Social media buzz!';
      case MarketEvent.SUGAR_SHORT: return 'Sugar shortage';
      case MarketEvent.INFLATION: return 'Rising costs';
      default: return '';
    }
  };

  return (
    <div className="game-ui">
      {/* Day Progress Header */}
      <div className="day-header">
        <h2>Day {currentDay} of {maxDays}</h2>
        <div className="day-progress">
          {Array.from({ length: maxDays }, (_, i) => (
            <div 
              key={i} 
              className={`day-dot ${i < currentDay ? 'completed' : i === currentDay - 1 ? 'current' : 'upcoming'}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Lemonade Stand Image */}
      <div className="stand-image">
        <img 
          src="/lemonomics-banner.png" 
          alt="Lemonomics Lemonade Stand" 
          className="pixel-art"
        />
      </div>

      {/* Current Conditions */}
      <div className="conditions-panel">
        <h3>Today's Conditions</h3>
        
        {currentCycle && (
          <div className="daily-info">
            <div className="weather">
              <span className="icon">{getWeatherIcon(currentCycle.weather)}</span>
              <span className="label">{currentCycle.weather}</span>
            </div>
            
            {currentCycle.event !== MarketEvent.NONE && (
              <div className="event">
                <span className="icon">{getEventIcon(currentCycle.event)}</span>
                <span className="label">{getEventDescription(currentCycle.event)}</span>
              </div>
            )}
            
            <div className="prices">
              <div className="price-item">
                🍋 Lemons: ${currentCycle.lemonPrice.toFixed(2)}
              </div>
              <div className="price-item">
                🍬 Sugar: ${currentCycle.sugarPrice.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {weeklyFestival && (
          <div className="festival-info">
            <h4>🎉 Festival Week: {weeklyFestival.festival}</h4>
            <div className="festival-effects">
              <span>Demand: {(weeklyFestival.modifiers.demandMultiplier * 100).toFixed(0)}%</span>
              <span>Critical Sales: {(weeklyFestival.modifiers.criticalSaleChance * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Classic Lemonade Stand Controls */}
      <form onSubmit={handleSubmit} className="game-controls">
        <h3>🛒 Purchase Ingredients & Supplies</h3>
        
        <div className="input-group">
          <label htmlFor="lemons">🍋 Lemons to Buy</label>
          <input
            id="lemons"
            type="number"
            min="0"
            max="100"
            value={lemons}
            onChange={(e) => setLemons(parseInt(e.target.value) || 0)}
            disabled={isLoading}
          />
          <div className="input-hint">
            Cost: ${((currentCycle?.lemonPrice || 0.05) * lemons).toFixed(2)} 
            (${(currentCycle?.lemonPrice || 0.05).toFixed(2)} each) • Makes {lemons * 2} glasses
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="sugar">🍬 Cups of Sugar to Buy</label>
          <input
            id="sugar"
            type="number"
            min="0"
            max="50"
            value={sugar}
            onChange={(e) => setSugar(parseInt(e.target.value) || 0)}
            disabled={isLoading}
          />
          <div className="input-hint">
            Cost: ${((currentCycle?.sugarPrice || 0.03) * sugar).toFixed(2)} 
            (${(currentCycle?.sugarPrice || 0.03).toFixed(2)} each) • Makes {sugar * 4} glasses
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="glasses">🥤 Glasses to Make</label>
          <input
            id="glasses"
            type="number"
            min="0"
            max="200"
            value={glasses}
            onChange={(e) => setGlasses(parseInt(e.target.value) || 0)}
            disabled={isLoading}
          />
          <div className="input-hint">
            Max possible: {Math.min(lemons * 2, sugar * 4)} glasses 
            (limited by ingredients)
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="signs">📢 Advertising Signs to Make</label>
          <input
            id="signs"
            type="number"
            min="0"
            max="20"
            value={signs}
            onChange={(e) => setSigns(parseInt(e.target.value) || 0)}
            disabled={isLoading}
          />
          <div className="input-hint">
            Cost: ${(signs * 0.15).toFixed(2)} (15¢ each) • Attracts more customers
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="price-cents">💵 Price per Glass (cents)</label>
          <input
            id="price-cents"
            type="number"
            min="1"
            max="100"
            value={priceInCents}
            onChange={(e) => setPriceInCents(parseInt(e.target.value) || 10)}
            disabled={isLoading}
          />
          <div className="input-hint">
            ${(priceInCents / 100).toFixed(2)} per glass • Sweet spot: 8-15¢
          </div>
        </div>

        <div className="cost-summary">
          <h4>💰 Total Costs</h4>
          <div className="cost-breakdown">
            <div>Lemons: ${((currentCycle?.lemonPrice || 0.05) * lemons).toFixed(2)}</div>
            <div>Sugar: ${((currentCycle?.sugarPrice || 0.03) * sugar).toFixed(2)}</div>
            <div>Signs: ${(signs * 0.15).toFixed(2)}</div>
            <div className="total-cost">
              <strong>Total: ${(
                (currentCycle?.lemonPrice || 0.05) * lemons + 
                (currentCycle?.sugarPrice || 0.03) * sugar + 
                signs * 0.15
              ).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="run-button"
          disabled={isLoading || glasses <= 0}
        >
          {isLoading ? 'Opening Stand...' : '🚀 Open Lemonade Stand!'}
        </button>
      </form>
    </div>
  );
};

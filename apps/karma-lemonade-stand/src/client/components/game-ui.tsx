import React, { useState, useEffect } from 'react';
import { WeatherType, MarketEvent, DailyCycle, WeeklyCycle } from '../../shared/types/game.js';

interface GameUIProps {
  onRunGame: (price: number, adSpend: number) => void;
  currentCycle?: DailyCycle;
  weeklyFestival?: WeeklyCycle;
  isLoading?: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({ 
  onRunGame, 
  currentCycle, 
  weeklyFestival, 
  isLoading = false 
}) => {
  const [price, setPrice] = useState(0.50);
  const [adSpend, setAdSpend] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price > 0 && adSpend >= 0) {
      onRunGame(price, adSpend);
    }
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

      {/* Game Controls */}
      <form onSubmit={handleSubmit} className="game-controls">
        <h3>Set Your Strategy</h3>
        
        <div className="input-group">
          <label htmlFor="price">Lemonade Price</label>
          <div className="price-input">
            <span className="currency">$</span>
            <input
              id="price"
              type="number"
              min="0.10"
              max="5.00"
              step="0.05"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className="input-hint">
            Recommended: $0.25 - $1.50
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="adSpend">Advertising Budget</label>
          <div className="price-input">
            <span className="currency">$</span>
            <input
              id="adSpend"
              type="number"
              min="0"
              max="50"
              step="1"
              value={adSpend}
              onChange={(e) => setAdSpend(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className="input-hint">
            More ads = more customers
          </div>
        </div>

        <button 
          type="submit" 
          className="run-button"
          disabled={isLoading || price <= 0}
        >
          {isLoading ? 'Running Stand...' : '🍋 Run Lemonade Stand!'}
        </button>
      </form>
    </div>
  );
};

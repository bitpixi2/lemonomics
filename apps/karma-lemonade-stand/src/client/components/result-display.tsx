import React from 'react';
import { GameResult } from '../../shared/types/game.js';
import { ProgressUpdate } from '../../server/progress/progress-service.js';

interface ResultDisplayProps {
  result: GameResult;
  progress?: ProgressUpdate;
  onPlayAgain: () => void;
  onShare?: () => void;
  currentDay?: number;
  maxDays?: number;
  dayResults?: GameResult[];
  totalProfit?: number;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  progress, 
  onPlayAgain, 
  onShare,
  currentDay = 1,
  maxDays = 3,
  dayResults = [],
  totalProfit = 0
}) => {
  const isProfitable = result.profit > 0;
  const isNewBest = progress?.isNewBest || false;
  const streakMilestone = progress?.streakMilestone;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 20) return '#4caf50'; // Great profit - green
    if (profit > 0) return '#8bc34a'; // Good profit - light green
    if (profit > -10) return '#ff9800'; // Small loss - orange
    return '#f44336'; // Big loss - red
  };

  const getResultEmoji = (profit: number) => {
    if (profit > 50) return '🏆';
    if (profit > 20) return '🎉';
    if (profit > 0) return '😊';
    if (profit > -10) return '😐';
    return '😞';
  };

  const isLastDay = currentDay >= maxDays;
  const nextButtonText = isLastDay ? '🏁 Finish Game' : `➡️ Continue to Day ${currentDay + 1}`;

  return (
    <div className="result-display">
      <div className="result-header">
        <div className="result-emoji">
          {getResultEmoji(result.profit)}
        </div>
        <h2>Day {currentDay} Results</h2>
      </div>

      {/* Main Profit Display */}
      <div className="profit-display">
        <div 
          className="profit-amount"
          style={{ color: getProfitColor(result.profit) }}
        >
          {formatCurrency(result.profit)}
        </div>
        <div className="profit-label">
          {isProfitable ? 'Profit!' : 'Loss'}
        </div>
      </div>

      {/* Achievement Badges */}
      {(isNewBest || streakMilestone) && (
        <div className="achievements">
          {isNewBest && (
            <div className="achievement new-best">
              🏅 New Personal Best!
            </div>
          )}
          {streakMilestone && (
            <div className="achievement streak-milestone">
              🔥 {streakMilestone} Day Streak!
            </div>
          )}
        </div>
      )}

      {/* Detailed Results */}
      <div className="result-details">
        <div className="detail-row">
          <span className="label">Cups Sold:</span>
          <span className="value">{result.cupsSold}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Weather:</span>
          <span className="value">
            {getWeatherIcon(result.weather)} {result.weather}
          </span>
        </div>
        
        {result.event && (
          <div className="detail-row">
            <span className="label">Market Event:</span>
            <span className="value">
              {getEventIcon(result.event)} {result.event}
            </span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="label">Festival:</span>
          <span className="value">🎉 {result.festival}</span>
        </div>

        {result.powerupsApplied?.length > 0 && (
          <div className="detail-row">
            <span className="label">Power-ups:</span>
            <span className="value">
              {result.powerupsApplied.map(powerup => 
                getPowerupIcon(powerup)
              ).join(' ')}
            </span>
          </div>
        )}
      </div>

      {/* Progress Info */}
      {progress && (
        <div className="progress-info">
          <div className="progress-row">
            <span className="label">Current Streak:</span>
            <span className="value">{progress.streak.currentStreak} days</span>
          </div>
          <div className="progress-row">
            <span className="label">Best Profit:</span>
            <span className="value">{formatCurrency(progress.personalBest.bestProfit)}</span>
          </div>
          <div className="progress-row">
            <span className="label">Total Runs:</span>
            <span className="value">{progress.personalBest.totalRuns}</span>
          </div>
        </div>
      )}

      {/* Multi-Day Progress */}
      {dayResults && dayResults.length > 0 && (
        <div className="multi-day-progress">
          <h3>Progress Summary</h3>
          <div className="days-completed">
            {dayResults.map((dayResult, index) => (
              <div key={index} className={`day-result ${index === currentDay - 1 ? 'current' : ''}`}>
                <span className="day-label">Day {index + 1}</span>
                <span className="day-profit">${dayResult.profit.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="total-so-far">
            <strong>Total So Far: ${totalProfit?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="result-actions">
        <button 
          className="play-again-button"
          onClick={onPlayAgain}
        >
          {nextButtonText}
        </button>
        
        {onShare && (
          <button 
            className="share-button"
            onClick={onShare}
          >
            📱 Share Result
          </button>
        )}
      </div>
    </div>
  );
};

const getWeatherIcon = (weather: string) => {
  const icons: Record<string, string> = {
    'SUNNY': '☀️',
    'HOT': '🔥',
    'CLOUDY': '☁️',
    'RAINY': '🌧️',
    'COLD': '❄️'
  };
  return icons[weather] || '🌤️';
};

const getEventIcon = (event: string) => {
  const icons: Record<string, string> = {
    'VIRAL': '📱',
    'SUGAR_SHORT': '⚠️',
    'INFLATION': '📈'
  };
  return icons[event] || '';
};

const getPowerupIcon = (powerup: string) => {
  const icons: Record<string, string> = {
    'SUPER_SUGAR': '⚡',
    'PERFECT_DAY': '🌟',
    'FREE_AD': '📢'
  };
  return icons[powerup] || '💫';
};

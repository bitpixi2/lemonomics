// Results screen showing daily results with weather-specific background
import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { DayResult } from '../../shared/types/game.js';

interface ResultsScreenProps {
  dayResult: DayResult;
  preloader: VideoPreloader;
  onVideoError: (error: Error) => void;
  onNextDay: () => void;
  onRestart: () => void;
  onSaveAndPost: () => void;
  totalCash: number;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  dayResult,
  preloader,
  onVideoError,
  onNextDay,
  onRestart,
  onSaveAndPost,
  totalCash
}) => {
  const handleRestart = () => {
    if (confirm('Are you sure you want to restart? This will lose your current progress.')) {
      onRestart();
    }
  };

  return (
    <div className="results-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.results[dayResult.weather]}
        preloader={preloader}
        onVideoError={onVideoError}
        className="results-video"
        autoplay={true}
        controls={false}
        muted={false}
        loop={false}
        fadeIn={true}
      />
      
      <div className="results-overlay">
        <div className="results-content">
          <h2>Day {dayResult.day} Results</h2>
          
          <div className="results-summary">
            <div className="result-item">
              <span className="label">Weather:</span>
              <span className="value">{dayResult.weather}</span>
            </div>
            <div className="result-item">
              <span className="label">Cups Sold:</span>
              <span className="value">{dayResult.cupsSold}</span>
            </div>
            <div className="result-item">
              <span className="label">Price per Cup:</span>
              <span className="value">${dayResult.pricePerCup.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span className="label">Revenue:</span>
              <span className="value">${dayResult.revenue.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span className="label">Costs:</span>
              <span className="value">${dayResult.costs.toFixed(2)}</span>
            </div>
            <div className="result-item profit">
              <span className="label">Profit:</span>
              <span className="value">${dayResult.profit.toFixed(2)}</span>
            </div>
            <div className="result-item total">
              <span className="label">Total Cash:</span>
              <span className="value">${totalCash.toFixed(2)}</span>
            </div>
          </div>

          {dayResult.customerDialogue.length > 0 && (
            <div className="customer-feedback">
              <h3>Customer Feedback:</h3>
              {dayResult.customerDialogue.map((comment, index) => (
                <p key={index} className="customer-comment">"{comment}"</p>
              ))}
            </div>
          )}

          <div className="results-actions">
            <button onClick={onNextDay} className="next-day-button">
              Next Day
            </button>
            <button onClick={handleRestart} className="restart-button">
              Restart
            </button>
            <button onClick={onSaveAndPost} className="save-post-button">
              Save Game & Post Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

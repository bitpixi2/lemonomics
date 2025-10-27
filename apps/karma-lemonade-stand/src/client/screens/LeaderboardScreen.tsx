// Leaderboard screen showing final game statistics and rankings
import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { GameEndResult } from '../../shared/types/game.js';

interface LeaderboardScreenProps {
  gameEndResult: GameEndResult;
  preloader: VideoPreloader;
  onVideoError: (error: Error) => void;
  onPlayAgain: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  gameEndResult,
  preloader,
  onVideoError,
  onPlayAgain
}) => {
  return (
    <div className="leaderboard-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.leaderboard['leaderboard-screen']}
        preloader={preloader}
        onVideoError={onVideoError}
        className="leaderboard-video"
        autoplay={true}
        controls={false}
        muted={false}
        loop={true}
        fadeIn={true}
      />
      
      <div className="leaderboard-overlay">
        <div className="leaderboard-content">
          <h2>🏆 Final Results</h2>
          
          <div className="final-stats">
            <div className="stat-item">
              <span className="label">Final Cash:</span>
              <span className="value">${gameEndResult.finalCash.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="label">Days Played:</span>
              <span className="value">{gameEndResult.totalDays}</span>
            </div>
            <div className="stat-item">
              <span className="label">Your Rank:</span>
              <span className="value">#{gameEndResult.leaderboardPosition}</span>
            </div>
          </div>

          <div className="leaderboard">
            <h3>Top 10 Leaderboard</h3>
            <div className="leaderboard-list">
              {gameEndResult.leaderboard.map((entry, index) => (
                <div 
                  key={index} 
                  className={`leaderboard-entry ${entry.isCurrentPlayer ? 'current-player' : ''}`}
                >
                  <span className="rank">#{entry.rank}</span>
                  <span className="username">{entry.username}</span>
                  <span className="cash">${entry.finalCash.toFixed(2)}</span>
                  <span className="days">{entry.daysPlayed} days</span>
                </div>
              ))}
            </div>
          </div>

          <div className="leaderboard-actions">
            <button onClick={onPlayAgain} className="play-again-button">
              🍋 Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

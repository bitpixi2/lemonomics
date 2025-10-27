// Loading results screen with weather-specific loading animation
import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { WeatherType } from '../../shared/types/game.js';

interface LoadingResultsScreenProps {
  weather: WeatherType;
  preloader: VideoPreloader;
  onVideoEnd: () => void;
  onVideoError: (error: Error) => void;
}

export const LoadingResultsScreen: React.FC<LoadingResultsScreenProps> = ({
  weather,
  preloader,
  onVideoEnd,
  onVideoError
}) => {
  return (
    <div className="loading-results-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.loadingResults[weather]}
        preloader={preloader}
        onVideoEnd={onVideoEnd}
        onVideoError={onVideoError}
        className="loading-results-video"
        autoplay={true}
        controls={false}
        muted={false}
        fadeIn={true}
      />
      
      <div className="loading-overlay">
        <div className="loading-message">
          <h2>Counting Your Earnings...</h2>
          <div className="loading-spinner">💰</div>
        </div>
      </div>
    </div>
  );
};

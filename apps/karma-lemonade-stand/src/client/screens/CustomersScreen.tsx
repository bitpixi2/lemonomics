// Customers screen showing weather-specific customer activity
import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { WeatherType } from '../../shared/types/game.js';

interface CustomersScreenProps {
  weather: WeatherType;
  preloader: VideoPreloader;
  onVideoEnd: () => void;
  onVideoError: (error: Error) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  weather,
  preloader,
  onVideoEnd,
  onVideoError
}) => {
  return (
    <div className="customers-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.customers[weather]}
        preloader={preloader}
        onVideoEnd={onVideoEnd}
        onVideoError={onVideoError}
        className="customers-video"
        autoplay={true}
        controls={false}
        muted={false}
        fadeIn={true}
      />
      
      <div className="customers-overlay">
        <div className="selling-message">
          <h2>Selling Lemonade...</h2>
          <p>Watch your customers enjoy your lemonade!</p>
        </div>
      </div>
    </div>
  );
};

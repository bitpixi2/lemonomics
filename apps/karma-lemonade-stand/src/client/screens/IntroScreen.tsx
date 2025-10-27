// Intro screen with weather-specific intro video
import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { WeatherType } from '../../shared/types/game.js';

interface IntroScreenProps {
  weather: WeatherType;
  day: number;
  preloader: VideoPreloader;
  onVideoEnd: () => void;
  onVideoError: (error: Error) => void;
  onStartGame: () => void;
  showStartButton: boolean;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  weather,
  day,
  preloader,
  onVideoEnd,
  onVideoError,
  onStartGame,
  showStartButton
}) => {
  return (
    <div className="intro-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.intro[weather]}
        preloader={preloader}
        onVideoEnd={onVideoEnd}
        onVideoError={onVideoError}
        className="intro-video"
        autoplay={true}
        controls={false}
        muted={false}
        fadeIn={true}
      />
      
      {showStartButton && (
        <div className="intro-overlay">
          <div className="intro-content">
            <h1>🍋 Lemonomics</h1>
            <h2>Day {day}</h2>
            <p className="weather-info">Today's Weather: <strong>{weather}</strong></p>
            <div className="intro-story">
              {day === 1 ? (
                <>
                  <p>Welcome to the classic lemonade stand game!</p>
                  <p>Your mom gives you $10 to get started.</p>
                  <p>She also gives you 2 cups of sugar for free to help you begin.</p>
                  <p>Can you build a successful lemonade business?</p>
                </>
              ) : (
                <>
                  <p>Ready for another day of business?</p>
                  <p>Check the weather and plan your strategy!</p>
                  <p>Good luck with your lemonade stand!</p>
                </>
              )}
            </div>
            <button 
              onClick={onStartGame} 
              className="start-game-button"
            >
              {day === 1 ? 'Start Game' : 'Continue Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

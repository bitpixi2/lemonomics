import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoAsset, VideoPlayerState } from '../../shared/types/video.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { AudioControl } from './AudioControl.js';

interface VideoPlayerProps {
  videoAsset: VideoAsset;
  preloader: VideoPreloader;
  onVideoEnd?: () => void;
  onVideoStart?: () => void;
  onVideoError?: (error: Error) => void;
  onVideoReady?: () => void;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  fadeIn?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoAsset,
  preloader,
  onVideoEnd,
  onVideoStart,
  onVideoError,
  onVideoReady,
  className = '',
  autoplay = true,
  controls = false,
  muted = false,
  loop = false,
  fadeIn = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    isLoading: true,
    hasError: false,
    progress: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const [isVisible, setIsVisible] = useState(!fadeIn);

  const handleVideoEnd = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    onVideoEnd?.();
  }, [onVideoEnd]);

  const handleVideoStart = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
    onVideoStart?.();
  }, [onVideoStart]);

  const handleVideoError = useCallback(() => {
    const error = new Error(`Failed to load video: ${videoAsset.filename} (attempt ${retryCount + 1})`);
    console.warn('Video error:', error.message);
    
    // Try to retry up to 2 times before giving up
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 1000);
    } else {
      setPlayerState(prev => ({ ...prev, hasError: true, isLoading: false }));
      onVideoError?.(error);
    }
  }, [videoAsset.filename, onVideoError, retryCount]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setPlayerState(prev => ({ ...prev, progress: isNaN(progress) ? 0 : progress }));
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isLoading: false }));
    if (fadeIn) {
      setIsVisible(true);
    }
    onVideoReady?.();
  }, [fadeIn, onVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try to use preloaded video first
    const preloadedVideo = preloader.getPreloadedVideo(videoAsset);
    if (preloadedVideo) {
      video.src = preloadedVideo.src;
    } else {
      video.src = videoAsset.filename;
    }

    video.autoplay = autoplay;
    video.controls = controls;
    video.muted = muted;
    video.loop = loop;
    video.preload = 'auto';
    video.playsInline = true; // Important for mobile

    // Add event listeners
    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('play', handleVideoStart);
    video.addEventListener('error', handleVideoError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('canplay', handleCanPlay);

    // Cleanup function
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('play', handleVideoStart);
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoAsset, preloader, autoplay, controls, muted, handleVideoEnd, handleVideoStart, handleVideoError, handleTimeUpdate, handleCanPlay]);

  const playVideo = useCallback(() => {
    if (videoRef.current && !playerState.hasError) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Video play failed:', error);
          // Handle autoplay restrictions on mobile
          if (error.name === 'NotAllowedError') {
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
          } else {
            handleVideoError();
          }
        });
      }
    }
  }, [playerState.hasError, handleVideoError]);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  return (
    <div className={`video-player ${className} ${fadeIn ? 'fade-in' : ''}`}>
      <AudioControl />
      <video
        ref={videoRef}
        className={`video-element ${isVisible ? 'visible' : 'hidden'}`}
        playsInline
        webkit-playsinline="true"
      />
      
      {playerState.isLoading && (
        <div className="video-loading">
          <div className="loading-spinner">Loading video...</div>
        </div>
      )}
      
      {playerState.hasError && (
        <div className="video-error">
          <div className="error-message">
            Failed to load video after {retryCount + 1} attempts.
          </div>
          <div className="error-details">
            Video: {videoAsset.filename}
          </div>
          <button onClick={() => {
            setRetryCount(0);
            setPlayerState(prev => ({ ...prev, hasError: false, isLoading: true }));
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}>
            Try Again
          </button>
          <button onClick={() => window.location.reload()}>
            Reload Game
          </button>
        </div>
      )}
      
      {!controls && !playerState.hasError && (
        <div className="video-controls">
          {!playerState.isPlaying && !playerState.isLoading && (
            <button onClick={playVideo} className="play-button">
              ▶️ Play
            </button>
          )}
          {playerState.isPlaying && (
            <button onClick={pauseVideo} className="pause-button">
              ⏸️ Pause
            </button>
          )}
        </div>
      )}
      
      <div className="video-progress">
        <div 
          className="progress-bar" 
          style={{ width: `${playerState.progress}%` }}
        />
      </div>
    </div>
  );
};

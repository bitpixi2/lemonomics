import React, { useState, useEffect } from 'react';
import { audioManager } from '../services/audio-manager.js';

export const AudioControls: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [effectsVolume, setEffectsVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.7);

  useEffect(() => {
    setIsMuted(audioManager.isMutedStatus());
  }, []);

  const handleToggleMute = () => {
    const newMutedState = audioManager.toggleMute();
    setIsMuted(newMutedState);
    
    // Play a quick sound to confirm unmute
    if (!newMutedState) {
      setTimeout(() => {
        audioManager.playSound('button-click', 0.3);
      }, 100);
    }
  };

  const handleEffectsVolumeChange = (volume: number) => {
    setEffectsVolume(volume);
    audioManager.setEffectsVolume(volume);
    
    // Play a sample sound to test volume
    audioManager.playSound('button-click', volume);
  };

  const handleMusicVolumeChange = (volume: number) => {
    setMusicVolume(volume);
    audioManager.setMusicVolume(volume);
  };

  return (
    <div className="audio-controls">
      <div className="audio-controls-header">
        <h3>🔊 Audio Settings</h3>
        <button 
          className={`mute-toggle ${isMuted ? 'muted' : 'unmuted'}`}
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {!isMuted && (
        <div className="volume-controls">
          <div className="volume-control">
            <label htmlFor="effects-volume">
              🎵 Effects: {Math.round(effectsVolume * 100)}%
            </label>
            <input
              id="effects-volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={effectsVolume}
              onChange={(e) => handleEffectsVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>

          <div className="volume-control">
            <label htmlFor="music-volume">
              🎶 Music: {Math.round(musicVolume * 100)}%
            </label>
            <input
              id="music-volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
        </div>
      )}

    </div>
  );
};

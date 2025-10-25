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

      <style jsx>{`
        .audio-controls {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 12px;
          margin: 10px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .audio-controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .audio-controls-header h3 {
          margin: 0;
          font-size: 0.9em;
          color: #333;
        }

        .mute-toggle {
          background: none;
          border: none;
          font-size: 1.2em;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .mute-toggle:hover {
          background: rgba(0,0,0,0.1);
        }

        .mute-toggle.muted {
          opacity: 0.5;
        }

        .volume-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .volume-control {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .volume-control label {
          font-size: 0.8em;
          color: #666;
          font-weight: 500;
        }

        .volume-slider {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #ddd;
          outline: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4caf50;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4caf50;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        @media (max-width: 768px) {
          .audio-controls {
            padding: 8px;
            margin: 8px 0;
          }
          
          .audio-controls-header h3 {
            font-size: 0.8em;
          }
          
          .mute-toggle {
            font-size: 1em;
          }
        }
      `}</style>
    </div>
  );
};

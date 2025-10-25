import { useCallback } from 'react';
import { audioManager } from '../services/audio-manager.js';

export const useAudio = () => {
  const playSound = useCallback((soundName: string, volume?: number) => {
    audioManager.playSound(soundName, volume);
  }, []);

  const playMusic = useCallback((musicName: string, loop: boolean = true) => {
    audioManager.playMusic(musicName, loop);
  }, []);

  const stopMusic = useCallback(() => {
    audioManager.stopMusic();
  }, []);

  // Convenience functions for common game sounds
  const playButtonClick = useCallback(() => {
    playSound('button-click', 0.4);
  }, [playSound]);

  const playLemonadeAction = useCallback(() => {
    playSound('lemon-squeeze', 0.6);
  }, [playSound]);

  const playCashRegister = useCallback(() => {
    playSound('cash-register', 0.7);
  }, [playSound]);

  const playVictoryFanfare = useCallback(() => {
    playSound('victory-fanfare', 0.8);
  }, [playSound]);

  const playCustomerReaction = useCallback((isHappy: boolean) => {
    playSound(isHappy ? 'customer-happy' : 'customer-sad', 0.5);
  }, [playSound]);

  const playWeatherSound = useCallback((weather: string) => {
    switch (weather) {
      case 'RAINY':
        playSound('rain', 0.3);
        break;
      case 'COLD':
      case 'CLOUDY':
        playSound('wind', 0.2);
        break;
      default:
        playSound('birds-chirping', 0.2);
        break;
    }
  }, [playSound]);

  return {
    playSound,
    playMusic,
    stopMusic,
    playButtonClick,
    playLemonadeAction,
    playCashRegister,
    playVictoryFanfare,
    playCustomerReaction,
    playWeatherSound,
  };
};

export default useAudio;

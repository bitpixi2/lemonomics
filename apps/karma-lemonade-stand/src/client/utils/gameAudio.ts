// Game-specific audio integration for Lemonomics
import { AudioManager } from './audioManager.js';
import { GamePhase } from './videoSequencer.js';

export class GameAudio {
  private audioManager: AudioManager;

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Play background music for different game phases
   */
  playPhaseMusic(_phase: GamePhase): void {
    // Use the same background music throughout the game
    this.audioManager.playBackgroundMusic('/audio/background/market-flute.mp3', true);
  }

  /**
   * Play sound effects for game actions
   */
  playPurchaseSound(): void {
    // this.audioManager.playSoundEffect('purchase', '/audio/effects/purchase-sound.mp3');
  }

  playCoinSound(): void {
    // this.audioManager.playSoundEffect('coin', '/audio/effects/coin-sound.mp3');
  }

  playSuccessSound(): void {
    // this.audioManager.playSoundEffect('success', '/audio/effects/success-sound.mp3');
  }

  playButtonClick(): void {
    // this.audioManager.playSoundEffect('click', '/audio/effects/button-click.mp3');
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.audioManager.stopBackgroundMusic();
  }

  /**
   * Preload all game audio assets
   */
  preloadGameAudio(): void {
    // Preload the background music
    this.audioManager.preloadSoundEffect('market-flute', '/audio/background/market-flute.mp3');
  }
}

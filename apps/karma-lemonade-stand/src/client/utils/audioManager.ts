// Audio management system for Lemonomics
export class AudioManager {
  private static instance: AudioManager;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Load mute preference from localStorage
    const savedMute = localStorage.getItem('lemonomics-audio-muted');
    this.isMuted = savedMute === 'true';
    
    const savedVolume = localStorage.getItem('lemonomics-audio-volume');
    this.volume = savedVolume ? parseFloat(savedVolume) : 0.7;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Set global mute state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('lemonomics-audio-muted', muted.toString());
    
    // Apply to all audio elements
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = muted;
    }
    
    this.soundEffects.forEach(audio => {
      audio.muted = muted;
    });

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('audioMuteChanged', { detail: { muted } }));
  }

  /**
   * Get current mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Set global volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('lemonomics-audio-volume', this.volume.toString());
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume * 0.5; // Background music at 50% of global volume
    }
    
    this.soundEffects.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  /**
   * Play background music
   */
  playBackgroundMusic(src: string, loop: boolean = true): void {
    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }

      this.backgroundMusic = new Audio(src);
      this.backgroundMusic.loop = loop;
      this.backgroundMusic.volume = this.volume * 0.5;
      this.backgroundMusic.muted = this.isMuted;
      
      // Handle autoplay restrictions
      const playPromise = this.backgroundMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Background music autoplay prevented:', error);
        });
      }
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
  }

  /**
   * Play sound effect
   */
  playSoundEffect(name: string, src: string): void {
    try {
      let audio = this.soundEffects.get(name);
      
      if (!audio) {
        audio = new Audio(src);
        audio.volume = this.volume;
        audio.muted = this.isMuted;
        this.soundEffects.set(name, audio);
      }

      // Reset and play
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Sound effect play prevented:', error);
        });
      }
    } catch (error) {
      console.warn(`Failed to play sound effect ${name}:`, error);
    }
  }

  /**
   * Preload sound effects
   */
  preloadSoundEffect(name: string, src: string): void {
    try {
      const audio = new Audio(src);
      audio.volume = this.volume;
      audio.muted = this.isMuted;
      audio.preload = 'auto';
      this.soundEffects.set(name, audio);
    } catch (error) {
      console.warn(`Failed to preload sound effect ${name}:`, error);
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
}

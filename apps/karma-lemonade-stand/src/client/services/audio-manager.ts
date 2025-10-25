export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private musicVolume: number = 0.7;
  private effectsVolume: number = 0.8;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  /**
   * Initialize audio system (call after first user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
      console.log('🔊 Audio system initialized');
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  /**
   * Preload an audio file
   */
  async preloadSound(name: string, path: string): Promise<void> {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      
      return new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => {
          this.sounds.set(name, audio);
          resolve();
        });
        
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load sound: ${name}`, e);
          reject(e);
        });
        
        audio.load();
      });
    } catch (error) {
      console.warn(`Error preloading sound ${name}:`, error);
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(name: string, volume?: number): Promise<void> {
    if (this.isMuted || !this.isInitialized) return;

    const audio = this.sounds.get(name);
    if (!audio) {
      console.warn(`Sound not found: ${name}`);
      return;
    }

    try {
      // Clone the audio element to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = (volume ?? this.effectsVolume) * (this.isMuted ? 0 : 1);
      
      await audioClone.play();
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }

  /**
   * Play background music (looped)
   */
  async playMusic(name: string, loop: boolean = true): Promise<void> {
    if (this.isMuted || !this.isInitialized) return;

    const audio = this.sounds.get(name);
    if (!audio) {
      console.warn(`Music not found: ${name}`);
      return;
    }

    try {
      audio.volume = this.musicVolume * (this.isMuted ? 0 : 1);
      audio.loop = loop;
      await audio.play();
    } catch (error) {
      console.warn(`Failed to play music ${name}:`, error);
    }
  }

  /**
   * Stop all music
   */
  stopMusic(): void {
    this.sounds.forEach((audio, name) => {
      if (name.includes('music') || name.includes('theme')) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  /**
   * Set effects volume (0-1)
   */
  setEffectsVolume(volume: number): void {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update currently playing music
    this.sounds.forEach((audio, name) => {
      if ((name.includes('music') || name.includes('theme')) && !audio.paused) {
        audio.volume = this.musicVolume * (this.isMuted ? 0 : 1);
      }
    });
  }

  /**
   * Toggle mute/unmute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Update all currently playing audio
    this.sounds.forEach((audio) => {
      if (!audio.paused) {
        audio.volume = audio.volume * (this.isMuted ? 0 : 1);
      }
    });
    
    return this.isMuted;
  }

  /**
   * Get mute status
   */
  isMutedStatus(): boolean {
    return this.isMuted;
  }

  /**
   * Preload all game sounds
   */
  async preloadGameSounds(): Promise<void> {
    const soundsToLoad = [
      // Effects
      { name: 'lemonade-pour', path: '/assets/audio/effects/lemonade-pour.mp3' },
      { name: 'lemon-squeeze', path: '/assets/audio/effects/lemon-squeeze.mp3' },
      { name: 'cash-register', path: '/assets/audio/effects/cash-register.mp3' },
      { name: 'customer-happy', path: '/assets/audio/effects/customer-happy.mp3' },
      { name: 'customer-sad', path: '/assets/audio/effects/customer-sad.mp3' },
      { name: 'rain', path: '/assets/audio/effects/rain.mp3' },
      { name: 'wind', path: '/assets/audio/effects/wind.mp3' },
      { name: 'victory-fanfare', path: '/assets/audio/effects/victory-fanfare.mp3' },
      { name: 'dice-roll', path: '/assets/audio/effects/dice-roll.mp3' },
      { name: 'button-click', path: '/assets/audio/effects/button-click.mp3' },
      { name: 'notification', path: '/assets/audio/effects/notification.mp3' },
      
      // Music
      { name: 'main-theme', path: '/assets/audio/music/main-theme.mp3' },
      { name: 'festival-halloween', path: '/assets/audio/music/festival-halloween.mp3' },
      { name: 'festival-christmas', path: '/assets/audio/music/festival-christmas.mp3' },
      { name: 'festival-summer', path: '/assets/audio/music/festival-summer.mp3' },
      { name: 'festival-medieval', path: '/assets/audio/music/festival-medieval.mp3' },
      
      // Ambient
      { name: 'market-chatter', path: '/assets/audio/ambient/market-chatter.mp3' },
      { name: 'birds-chirping', path: '/assets/audio/ambient/birds-chirping.mp3' },
      { name: 'thunder', path: '/assets/audio/ambient/thunder.mp3' },
    ];

    const loadPromises = soundsToLoad.map(({ name, path }) => 
      this.preloadSound(name, path).catch(() => {
        // Silently fail for missing files
        console.log(`Optional sound not found: ${name}`);
      })
    );

    await Promise.allSettled(loadPromises);
    console.log('🎵 Audio preloading complete');
  }
}

// Singleton instance
export const audioManager = new AudioManager();

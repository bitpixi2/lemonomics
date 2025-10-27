// Video preloading utility for Lemonomics
import { VideoAsset, VideoConfig, DEFAULT_VIDEO_CONFIG, VIDEO_ASSETS } from '../../shared/types/video.js';
import { WeatherType } from '../../shared/types/game.js';

export class VideoPreloader {
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();
  private preloadPromises: Map<string, Promise<void>> = new Map();
  private config: VideoConfig;
  private isMobile: boolean;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = { ...DEFAULT_VIDEO_CONFIG, ...config };
    this.isMobile = this.detectMobile();
  }

  /**
   * Detect if running on mobile device
   */
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Preload videos based on the configured strategy
   */
  async preloadVideos(): Promise<void> {
    const { preloadStrategy } = this.config;

    // On mobile, be more conservative with preloading
    if (this.isMobile && preloadStrategy === 'all') {
      console.log('Mobile detected: reducing preload strategy from "all" to "intro"');
      await this.preloadIntroVideos();
      return;
    }

    switch (preloadStrategy) {
      case 'intro':
        await this.preloadIntroVideos();
        break;
      case 'weather':
        await this.preloadWeatherVideos();
        break;
      case 'all':
        await this.preloadAllVideos();
        break;
      case 'none':
      default:
        // No preloading
        break;
    }
  }

  /**
   * Preload intro videos for all weather types
   */
  private async preloadIntroVideos(): Promise<void> {
    const videosToPreload = [
      ...Object.values(VIDEO_ASSETS.intro)
    ];

    await Promise.all(videosToPreload.map(video => this.preloadVideo(video)));
  }

  /**
   * Preload weather-specific videos for a given weather type
   */
  async preloadWeatherVideos(weather?: WeatherType): Promise<void> {
    if (weather) {
      const videosToPreload = [
        VIDEO_ASSETS.ingredients[weather],
        VIDEO_ASSETS.customers[weather],
        VIDEO_ASSETS.loadingResults[weather],
        VIDEO_ASSETS.results[weather]
      ];
      await Promise.all(videosToPreload.map(video => this.preloadVideo(video)));
    } else {
      // Preload all weather videos
      const allWeatherVideos = [
        ...Object.values(VIDEO_ASSETS.ingredients),
        ...Object.values(VIDEO_ASSETS.customers),
        ...Object.values(VIDEO_ASSETS.loadingResults),
        ...Object.values(VIDEO_ASSETS.results)
      ];
      await Promise.all(allWeatherVideos.map(video => this.preloadVideo(video)));
    }
  }

  /**
   * Preload all videos
   */
  private async preloadAllVideos(): Promise<void> {
    const allVideos = [
      ...Object.values(VIDEO_ASSETS.intro),
      ...Object.values(VIDEO_ASSETS.ingredients),
      ...Object.values(VIDEO_ASSETS.customers),
      ...Object.values(VIDEO_ASSETS.loadingResults),
      ...Object.values(VIDEO_ASSETS.results),
      ...Object.values(VIDEO_ASSETS.leaderboard)
    ];

    await Promise.all(allVideos.map(video => this.preloadVideo(video)));
  }

  /**
   * Preload a single video
   */
  private async preloadVideo(videoAsset: VideoAsset): Promise<void> {
    // Check if already preloading or preloaded
    const existingPromise = this.preloadPromises.get(videoAsset.filename);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const video = document.createElement('video');
      
      video.preload = this.isMobile ? 'metadata' : 'auto'; // Less aggressive on mobile
      video.muted = this.config.muted;
      video.playsInline = true; // Important for mobile
      
      const timeout = setTimeout(() => {
        console.warn(`Video preload timeout: ${videoAsset.filename}`);
        reject(new Error(`Video preload timeout: ${videoAsset.filename}`));
      }, 10000); // 10 second timeout

      video.addEventListener('canplaythrough', () => {
        clearTimeout(timeout);
        this.preloadedVideos.set(videoAsset.filename, video);
        console.log(`Successfully preloaded: ${videoAsset.filename}`);
        resolve();
      });

      video.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.warn(`Failed to preload video: ${videoAsset.filename}`, e);
        reject(new Error(`Failed to preload video: ${videoAsset.filename}`));
      });

      video.src = videoAsset.filename;
    });

    this.preloadPromises.set(videoAsset.filename, promise);
    return promise;
  }

  /**
   * Get a preloaded video element
   */
  getPreloadedVideo(videoAsset: VideoAsset): HTMLVideoElement | null {
    return this.preloadedVideos.get(videoAsset.filename) || null;
  }

  /**
   * Create a new video element with proper configuration
   */
  createVideoElement(videoAsset: VideoAsset): HTMLVideoElement {
    const preloaded = this.getPreloadedVideo(videoAsset);
    
    if (preloaded) {
      return preloaded.cloneNode(true) as HTMLVideoElement;
    }

    const video = document.createElement('video');
    video.src = videoAsset.filename;
    video.autoplay = this.config.autoplay;
    video.controls = this.config.controls;
    video.muted = this.config.muted;
    video.preload = 'auto';

    return video;
  }

  /**
   * Check if a video is preloaded
   */
  isVideoPreloaded(videoAsset: VideoAsset): boolean {
    return this.preloadedVideos.has(videoAsset.filename);
  }

  /**
   * Get preload status for debugging
   */
  getPreloadStatus(): { [filename: string]: boolean } {
    const status: { [filename: string]: boolean } = {};
    
    // Check all video assets
    const allVideos = [
      ...Object.values(VIDEO_ASSETS.intro),
      ...Object.values(VIDEO_ASSETS.ingredients),
      ...Object.values(VIDEO_ASSETS.customers),
      ...Object.values(VIDEO_ASSETS.loadingResults),
      ...Object.values(VIDEO_ASSETS.results),
      ...Object.values(VIDEO_ASSETS.leaderboard)
    ];

    allVideos.forEach(video => {
      status[video.filename] = this.isVideoPreloaded(video);
    });

    return status;
  }

  /**
   * Clean up preloaded videos
   */
  cleanup(): void {
    this.preloadedVideos.forEach(video => {
      video.src = '';
      video.load();
    });
    this.preloadedVideos.clear();
    this.preloadPromises.clear();
  }
}

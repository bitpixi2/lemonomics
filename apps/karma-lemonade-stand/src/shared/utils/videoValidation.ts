// Video asset validation utilities
import { VideoAsset, VIDEO_ASSETS } from '../types/video.js';

export interface VideoValidationResult {
  isValid: boolean;
  missingAssets: string[];
  errors: string[];
}

/**
 * Validate that all required video assets are available
 */
export async function validateVideoAssets(): Promise<VideoValidationResult> {
  const result: VideoValidationResult = {
    isValid: true,
    missingAssets: [],
    errors: []
  };

  // Collect all video assets
  const allAssets: VideoAsset[] = [
    ...Object.values(VIDEO_ASSETS.intro),
    ...Object.values(VIDEO_ASSETS.notepad),
    ...Object.values(VIDEO_ASSETS.customers),
    ...Object.values(VIDEO_ASSETS.money),
    ...Object.values(VIDEO_ASSETS.leaderboard)
  ];

  // Check each asset
  for (const asset of allAssets) {
    try {
      const response = await fetch(asset.filename, { method: 'HEAD' });
      if (!response.ok) {
        result.missingAssets.push(asset.filename);
        result.isValid = false;
      }
    } catch (error) {
      result.missingAssets.push(asset.filename);
      result.errors.push(`Failed to check ${asset.filename}: ${error}`);
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Check if a specific video asset exists
 */
export async function checkVideoAsset(asset: VideoAsset): Promise<boolean> {
  try {
    const response = await fetch(asset.filename, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get video asset info (if supported by browser)
 */
export function getVideoInfo(videoElement: HTMLVideoElement): {
  duration: number;
  width: number;
  height: number;
  readyState: number;
} {
  return {
    duration: videoElement.duration || 0,
    width: videoElement.videoWidth || 0,
    height: videoElement.videoHeight || 0,
    readyState: videoElement.readyState
  };
}

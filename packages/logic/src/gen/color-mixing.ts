// Generated color mixing logic
// DO NOT EDIT - This file is auto-generated

/**
 * Mix multiple colors using linear RGB averaging
 * @param colors Array of hex colors to mix
 * @param weights Optional weights for each color (defaults to equal)
 * @param seed Optional seed for deterministic randomization
 * @returns Mixed color as hex string
 */
export function mixColor(
  colors: string[],
  weights?: number[],
  seed?: number
): string {
  if (colors.length === 0) {
    throw new Error("At least one color is required");
  }

  if (colors.length === 1) {
    return colors[0];
  }

  // Use equal weights if not provided
  const actualWeights = weights || colors.map(() => 1);

  if (actualWeights.length !== colors.length) {
    throw new Error("Weights array must match colors array length");
  }

  // Normalize weights
  const totalWeight = actualWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = actualWeights.map(w => w / totalWeight);

  // Convert hex colors to RGB
  const rgbColors = colors.map(hexToRgb);

  // Mix colors using weighted average
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < rgbColors.length; i++) {
    const weight = normalizedWeights[i];
    r += rgbColors[i].r * weight;
    g += rgbColors[i].g * weight;
    b += rgbColors[i].b * weight;
  }

  // Apply deterministic variation if seed provided
  if (seed !== undefined) {
    const rng = createSeededRandom(seed);
    const variation = 0.05; // 5% variation
    r = Math.max(0, Math.min(255, r + (rng() - 0.5) * 255 * variation));
    g = Math.max(0, Math.min(255, g + (rng() - 0.5) * 255 * variation));
    b = Math.max(0, Math.min(255, b + (rng() - 0.5) * 255 * variation));
  }

  // Convert back to hex
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Convert RGB values to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Create a seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // Linear congruential generator
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
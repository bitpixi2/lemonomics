// Generated layer helper functions
// DO NOT EDIT - This file is auto-generated

/**
 * Calculate and normalize layer percentages to total 100%
 * @param layers Array of layers with percentages
 * @returns Normalized layers totaling 100%
 */
export function normalizeLayerPercentages(
  layers: Array<{ color: string; percent: number }>
): Array<{ color: string; percent: number }> {
  if (layers.length === 0) return [];

  const total = layers.reduce((sum, layer) => sum + layer.percent, 0);
  if (total === 0) {
    // Equal distribution if all percentages are 0
    const equalPercent = 100 / layers.length;
    return layers.map(layer => ({ ...layer, percent: equalPercent }));
  }

  // Normalize to 100%
  return layers.map(layer => ({
    ...layer,
    percent: (layer.percent / total) * 100
  }));
}

/**
 * Generate a unique drink ID based on recipe and timestamp
 * @param drink The drink recipe
 * @param timestamp Creation timestamp
 * @param seed Optional seed for deterministic IDs
 * @returns Unique drink ID
 */
export function generateDrinkId(
  drink: { name: string; glass: string; base: string; mixMode: string },
  timestamp: number,
  seed?: number
): string {
  // Create a hash-like string from drink properties
  const components = [
    drink.name.toLowerCase().replace(/\s+/g, "-"),
    drink.glass,
    drink.base,
    drink.mixMode
  ].join("-");

  // Add timestamp for uniqueness
  const timeComponent = timestamp.toString(36);

  // Add seed if provided for deterministic testing
  const seedComponent = seed ? `-${seed.toString(36)}` : "";

  return `${components}-${timeComponent}${seedComponent}`;
}
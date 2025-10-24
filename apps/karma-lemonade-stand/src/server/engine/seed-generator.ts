/**
 * Generates deterministic seeds for game runs based on user ID and run count
 */
export class SeedGenerator {
  /**
   * Generates a deterministic seed for a game run
   * Uses user ID and run count to ensure reproducible results
   */
  generateSeed(userId: string, runCount: number): string {
    // Create a simple hash from userId and runCount
    const input = `${userId}-${runCount}`;
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and return as string
    const seed = Math.abs(hash).toString();
    return seed;
  }

  /**
   * Creates a seeded random number generator
   * Returns a function that generates deterministic random numbers 0-1
   */
  createSeededRandom(seed: string): () => number {
    let seedNum = parseInt(seed, 10);
    
    return function() {
      // Linear congruential generator
      seedNum = (seedNum * 1664525 + 1013904223) % Math.pow(2, 32);
      return seedNum / Math.pow(2, 32);
    };
  }

  /**
   * Generates a random integer between min and max (inclusive) using seed
   */
  randomInt(seed: string, min: number, max: number): number {
    const random = this.createSeededRandom(seed);
    return Math.floor(random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min and max using seed
   */
  randomFloat(seed: string, min: number, max: number): number {
    const random = this.createSeededRandom(seed);
    return random() * (max - min) + min;
  }

  /**
   * Returns true/false based on probability (0-1) using seed
   */
  randomBool(seed: string, probability: number): boolean {
    const random = this.createSeededRandom(seed);
    return random() < probability;
  }
}

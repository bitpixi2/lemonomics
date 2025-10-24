// Generated TypeScript types from YAML specifications
// DO NOT EDIT - This file is auto-generated

/**
 * Drink recipe specification for Bitpixi's Bar
 */
export interface Drink {
  /** Glass type for the drink */
  glass: 'tall' | 'short' | 'mug' | 'potion' | 'martini';
  /** Background scene for drink presentation */
  backdrop: 'counter' | 'neon' | 'pumpkin_night' | 'snow_window';
  /** Primary liquid base */
  base: 'coffee' | 'tea' | 'milk' | 'juice' | 'soda';
  /** Flavor additions (max 3) */
  flavors: string[];
  /** Drink toppings (max 3) */
  toppings: string[];
  /** How ingredients are combined */
  mixMode: 'blend' | 'layered';
  /** Hex color for blended drinks */
  color?: string;
  /** Layer configuration for layered drinks */
  layers?: Layer[];
  /** Custom drink name */
  name: string;
  /** Font style for drink name display */
  font: 'script' | 'serif' | 'sans-serif' | 'decorative' | 'handwritten';
  /** Unix timestamp of creation */
  createdAt: number;
  /** Reddit user ID of creator */
  authorUid: string;
}

/**
 * Layer configuration for layered drinks
 */
export interface Layer {
  /** Hex color of the layer */
  color: string;
  /** Percentage of total drink volume */
  percent: number;
}

// Enum types
export type GlassType = 'tall' | 'short' | 'mug' | 'potion' | 'martini';
export type BackdropType = 'counter' | 'neon' | 'pumpkin_night' | 'snow_window';
export type BaseType = 'coffee' | 'tea' | 'milk' | 'juice' | 'soda';
export type MixModeType = 'blend' | 'layered';
export type FontType = 'script' | 'serif' | 'sans-serif' | 'decorative' | 'handwritten';

/**
 * Drink state in the shop system
 */
export interface DrinkState {
  id: string;
  state: DrinkStateType;
  score: number;
  authorUid: string;
  thumbUrl: string;
  createdAt: number;
  redditPostId?: string;
}

export type DrinkStateType = 'PENDING' | 'FEATURED' | 'RETIRED';

/**
 * Player progression and statistics
 */
export interface PlayerStats {
  uid: string;
  drinksCreated: number;
  customComponentsUnlocked: boolean;
  totalScore: number;
  featuredDrinks: string[];
}

/**
 * Vote event data
 */
export interface VoteEvent {
  drinkId: string;
  userId: string;
  direction: 1 | -1;
  timestamp: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
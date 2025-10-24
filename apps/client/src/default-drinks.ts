/**
 * Default Featured Drinks
 * 
 * Provides the 3 default themed drinks that showcase different aesthetics:
 * girly, spooky Halloween, and cyberpunk neon styles.
 */

import type { Drink } from '@bitpixis-bar/types';

export interface DefaultFeaturedDrink {
  id: string;
  name: string;
  recipe: Drink;
  score: number;
  authorUid: string;
  thumbUrl: string;
  createdAt: number;
  theme: 'girly' | 'spooky' | 'cyberpunk';
  description: string;
}

/**
 * Get all default featured drinks
 */
export function getDefaultFeaturedDrinks(): DefaultFeaturedDrink[] {
  const baseTimestamp = Date.now() - 86400000; // 1 day ago

  return [
    {
      id: 'default-girly-sparkle',
      name: 'Pink Sparkle Dream',
      theme: 'girly',
      description: 'A dreamy pink creation with vanilla sweetness and whimsical toppings',
      recipe: {
        glass: 'martini',
        backdrop: 'counter',
        base: 'milk',
        flavors: ['vanilla', 'strawberry', 'rose'],
        toppings: ['whipped_cream', 'sprinkles', 'edible_glitter'],
        mixMode: 'blend',
        color: '#FFB6C1', // Light pink
        name: 'Pink Sparkle Dream',
        font: 'script',
        createdAt: baseTimestamp,
        authorUid: 'bitpixi_official',
      },
      score: 50,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/pink-sparkle-dream.jpg',
      createdAt: baseTimestamp,
    },
    {
      id: 'default-spooky-potion',
      name: 'Midnight Witch Brew',
      theme: 'spooky',
      description: 'A mysterious layered potion perfect for Halloween nights',
      recipe: {
        glass: 'potion',
        backdrop: 'pumpkin_night',
        base: 'coffee',
        flavors: ['dark_chocolate', 'cinnamon', 'black_cherry'],
        toppings: ['foam_art', 'cinnamon_stick', 'star_anise'],
        mixMode: 'layered',
        layers: [
          { color: '#2F1B14', percent: 50 }, // Dark brown base
          { color: '#8B4513', percent: 30 }, // Medium brown
          { color: '#D2691E', percent: 15 }, // Light brown
          { color: '#000000', percent: 5 },  // Black top
        ],
        name: 'Midnight Witch Brew',
        font: 'decorative',
        createdAt: baseTimestamp - 3600000, // 1 hour earlier
        authorUid: 'bitpixi_official',
      },
      score: 45,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/midnight-witch-brew.jpg',
      createdAt: baseTimestamp - 3600000,
    },
    {
      id: 'default-cyberpunk-neon',
      name: 'Neon Circuit Surge',
      theme: 'cyberpunk',
      description: 'An electrifying cyberpunk creation with glowing neon layers',
      recipe: {
        glass: 'tall',
        backdrop: 'neon',
        base: 'soda',
        flavors: ['electric_blue', 'citrus_burst', 'energy'],
        toppings: ['led_ice', 'neon_rim', 'electric_foam'],
        mixMode: 'layered',
        layers: [
          { color: '#00FFFF', percent: 35 }, // Cyan base
          { color: '#FF00FF', percent: 30 }, // Magenta middle
          { color: '#00FF00', percent: 25 }, // Green
          { color: '#FFFF00', percent: 10 }, // Yellow top
        ],
        name: 'Neon Circuit Surge',
        font: 'sans-serif',
        createdAt: baseTimestamp - 7200000, // 2 hours earlier
        authorUid: 'bitpixi_official',
      },
      score: 42,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/neon-circuit-surge.jpg',
      createdAt: baseTimestamp - 7200000,
    },
  ];
}

/**
 * Get default drink by theme
 */
export function getDefaultDrinkByTheme(theme: 'girly' | 'spooky' | 'cyberpunk'): DefaultFeaturedDrink | null {
  const drinks = getDefaultFeaturedDrinks();
  return drinks.find(drink => drink.theme === theme) || null;
}

/**
 * Get default drink by ID
 */
export function getDefaultDrinkById(id: string): DefaultFeaturedDrink | null {
  const drinks = getDefaultFeaturedDrinks();
  return drinks.find(drink => drink.id === id) || null;
}

/**
 * Check if a drink ID is a default drink
 */
export function isDefaultDrink(id: string): boolean {
  return id.startsWith('default-');
}

/**
 * Get recipe copy text for default drinks
 */
export function getDefaultDrinkRecipeCopy(id: string): string | null {
  const drink = getDefaultDrinkById(id);
  if (!drink) return null;

  const recipe = {
    name: drink.recipe.name,
    glass: drink.recipe.glass,
    backdrop: drink.recipe.backdrop,
    base: drink.recipe.base,
    flavors: drink.recipe.flavors,
    toppings: drink.recipe.toppings,
    mixMode: drink.recipe.mixMode,
    ...(drink.recipe.mixMode === 'blend' 
      ? { color: drink.recipe.color } 
      : { layers: drink.recipe.layers }
    ),
    font: drink.recipe.font,
    theme: drink.theme,
  };

  return JSON.stringify(recipe, null, 2);
}

/**
 * Create themed variations of a base drink
 */
export function createThemedVariation(baseDrink: Partial<Drink>, theme: 'girly' | 'spooky' | 'cyberpunk'): Partial<Drink> {
  const themedDrink = { ...baseDrink };

  switch (theme) {
    case 'girly':
      themedDrink.backdrop = 'counter';
      themedDrink.font = 'script';
      if (themedDrink.mixMode === 'blend') {
        themedDrink.color = '#FFB6C1'; // Light pink
      }
      themedDrink.flavors = ['vanilla', 'strawberry', 'rose'];
      themedDrink.toppings = ['whipped_cream', 'sprinkles'];
      break;

    case 'spooky':
      themedDrink.backdrop = 'pumpkin_night';
      themedDrink.font = 'decorative';
      themedDrink.glass = 'potion';
      if (themedDrink.mixMode === 'blend') {
        themedDrink.color = '#2F1B14'; // Dark brown
      }
      themedDrink.flavors = ['dark_chocolate', 'cinnamon'];
      themedDrink.toppings = ['foam_art', 'cinnamon_stick'];
      break;

    case 'cyberpunk':
      themedDrink.backdrop = 'neon';
      themedDrink.font = 'sans-serif';
      themedDrink.glass = 'tall';
      if (themedDrink.mixMode === 'blend') {
        themedDrink.color = '#00FFFF'; // Cyan
      }
      themedDrink.flavors = ['electric_blue', 'citrus_burst'];
      themedDrink.toppings = ['led_ice', 'neon_rim'];
      break;
  }

  return themedDrink;
}

/**
 * Get theme-appropriate color palette
 */
export function getThemeColorPalette(theme: 'girly' | 'spooky' | 'cyberpunk'): string[] {
  switch (theme) {
    case 'girly':
      return ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFE4E1', '#F0E68C'];
    case 'spooky':
      return ['#2F1B14', '#8B4513', '#D2691E', '#FF4500', '#000000'];
    case 'cyberpunk':
      return ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00', '#FF0080'];
    default:
      return ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'];
  }
}

/**
 * Get theme-appropriate backdrop
 */
export function getThemeBackdrop(theme: 'girly' | 'spooky' | 'cyberpunk'): string {
  switch (theme) {
    case 'girly':
      return 'counter';
    case 'spooky':
      return 'pumpkin_night';
    case 'cyberpunk':
      return 'neon';
    default:
      return 'counter';
  }
}

/**
 * Get theme-appropriate font
 */
export function getThemeFont(theme: 'girly' | 'spooky' | 'cyberpunk'): string {
  switch (theme) {
    case 'girly':
      return 'script';
    case 'spooky':
      return 'decorative';
    case 'cyberpunk':
      return 'sans-serif';
    default:
      return 'serif';
  }
}

/**
 * Get theme-appropriate glass type
 */
export function getThemeGlass(theme: 'girly' | 'spooky' | 'cyberpunk'): string {
  switch (theme) {
    case 'girly':
      return 'martini';
    case 'spooky':
      return 'potion';
    case 'cyberpunk':
      return 'tall';
    default:
      return 'short';
  }
}

/**
 * Generate random themed drink name
 */
export function generateThemedDrinkName(theme: 'girly' | 'spooky' | 'cyberpunk'): string {
  const names = {
    girly: [
      'Pink Sparkle Dream', 'Fairy Tale Fizz', 'Rose Garden Bliss', 'Cotton Candy Cloud',
      'Princess Potion', 'Butterfly Kiss', 'Sweet Dreams Swirl', 'Unicorn Magic'
    ],
    spooky: [
      'Midnight Witch Brew', 'Haunted Elixir', 'Vampire\'s Blood', 'Ghostly Mist',
      'Pumpkin Spice Curse', 'Raven\'s Revenge', 'Cauldron Bubble', 'Shadow Potion'
    ],
    cyberpunk: [
      'Neon Circuit Surge', 'Digital Dreams', 'Cyber Shock', 'Matrix Fuel',
      'Electric Pulse', 'Data Stream', 'Neural Link', 'Quantum Fizz'
    ]
  };

  const themeNames = names[theme];
  return themeNames[Math.floor(Math.random() * themeNames.length)];
}

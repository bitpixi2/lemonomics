/**
 * Featured Menu Post Component
 * 
 * Showcases top-rated content and serves as the main game entry point.
 * Displays top 3 featured drinks, recently approved components, and leaderboards.
 */

import type { Drink, PlayerStats } from '@bitpixis-bar/types';
import { context, reddit } from '@devvit/web/server';
import { redisService } from '../services/redis-service.js';
import { getDrinkPostData } from './submit-drink-post.js';
import { getApprovedComponents, type CustomComponent } from './submit-component-post.js';

export interface FeaturedDrink {
  id: string;
  name: string;
  recipe: Drink;
  score: number;
  authorUid: string;
  thumbUrl: string;
  createdAt: number;
}

export interface FeaturedMenuData {
  topDrinks: FeaturedDrink[];
  recentComponents: CustomComponent[];
  topCreators: Array<{ uid: string; totalScore: number; drinksCreated: number }>;
  stats: {
    totalDrinks: number;
    totalComponents: number;
    activeVoters: number;
  };
}

/**
 * Create a featured menu post on Reddit
 */
export async function createFeaturedMenuPost(): Promise<{ postId: string; subreddit: string }> {
  try {
    const title = '[Bitpixi\'s Bar] Featured Drinks & Components';
    const body = await generateFeaturedMenuBody();

    const post = await reddit.submitPost({
      title,
      text: body,
      subredditName: context.subredditName || 'bitpixis_bar_dev',
    });

    console.log(`✅ Created featured menu post: ${post.id}`);

    return {
      postId: post.id,
      subreddit: context.subredditName || 'bitpixis_bar_dev',
    };

  } catch (error) {
    console.error('❌ Failed to create featured menu post:', error);
    throw new Error(`Failed to create featured menu post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get featured menu data
 */
export async function getFeaturedMenuData(): Promise<FeaturedMenuData> {
  try {
    const [
      featuredDrinkIds,
      recentComponents,
      topCreators,
    ] = await Promise.all([
      redisService.getFeaturedDrinks(3), // Top 3 for display behind bartender
      getApprovedComponents(),
      redisService.getTopPlayers(5),
    ]);

    // Get full drink data for featured drinks
    const topDrinks: FeaturedDrink[] = [];
    for (const drinkInfo of featuredDrinkIds) {
      const drinkData = await getDrinkPostData(drinkInfo.drinkId);
      if (drinkData) {
        topDrinks.push({
          id: drinkInfo.drinkId,
          name: drinkData.drink.name,
          recipe: drinkData.drink,
          score: drinkInfo.score,
          authorUid: drinkData.metadata.authorUid,
          thumbUrl: drinkData.metadata.thumbUrl,
          createdAt: drinkData.metadata.createdAt,
        });
      }
    }

    // Get recent components (last 5 approved)
    const recentApprovedComponents = recentComponents
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // Get basic stats
    const stats = await getFeaturedMenuStats();

    return {
      topDrinks,
      recentComponents: recentApprovedComponents,
      topCreators,
      stats,
    };

  } catch (error) {
    console.error('❌ Failed to get featured menu data:', error);
    return {
      topDrinks: [],
      recentComponents: [],
      topCreators: [],
      stats: {
        totalDrinks: 0,
        totalComponents: 0,
        activeVoters: 0,
      },
    };
  }
}

/**
 * Get default featured drinks for new installations
 */
export async function getDefaultFeaturedDrinks(): Promise<FeaturedDrink[]> {
  // These are the 3 default drinks that showcase different themes
  const defaultDrinks: FeaturedDrink[] = [
    {
      id: 'default-girly-sparkle',
      name: 'Pink Sparkle Dream',
      recipe: {
        glass: 'martini',
        backdrop: 'counter',
        base: 'milk',
        flavors: ['vanilla', 'strawberry'],
        toppings: ['whipped_cream', 'sprinkles'],
        mixMode: 'blend',
        color: '#FFB6C1',
        name: 'Pink Sparkle Dream',
        font: 'script',
        createdAt: Date.now(),
        authorUid: 'bitpixi_official',
      } as Drink,
      score: 50,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/pink-sparkle-dream.jpg',
      createdAt: Date.now() - 86400000, // 1 day ago
    },
    {
      id: 'default-spooky-potion',
      name: 'Midnight Witch Brew',
      recipe: {
        glass: 'potion',
        backdrop: 'pumpkin_night',
        base: 'coffee',
        flavors: ['dark_chocolate', 'cinnamon'],
        toppings: ['foam_art', 'cinnamon_stick'],
        mixMode: 'layered',
        layers: [
          { color: '#2F1B14', percent: 60 },
          { color: '#8B4513', percent: 25 },
          { color: '#D2691E', percent: 15 },
        ],
        name: 'Midnight Witch Brew',
        font: 'decorative',
        createdAt: Date.now(),
        authorUid: 'bitpixi_official',
      } as Drink,
      score: 45,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/midnight-witch-brew.jpg',
      createdAt: Date.now() - 172800000, // 2 days ago
    },
    {
      id: 'default-cyberpunk-neon',
      name: 'Neon Circuit Surge',
      recipe: {
        glass: 'tall',
        backdrop: 'neon',
        base: 'soda',
        flavors: ['electric_blue', 'citrus'],
        toppings: ['led_ice', 'neon_rim'],
        mixMode: 'layered',
        layers: [
          { color: '#00FFFF', percent: 40 },
          { color: '#FF00FF', percent: 35 },
          { color: '#00FF00', percent: 25 },
        ],
        name: 'Neon Circuit Surge',
        font: 'sans-serif',
        createdAt: Date.now(),
        authorUid: 'bitpixi_official',
      } as Drink,
      score: 42,
      authorUid: 'bitpixi_official',
      thumbUrl: '/default-drinks/neon-circuit-surge.jpg',
      createdAt: Date.now() - 259200000, // 3 days ago
    },
  ];

  return defaultDrinks;
}

/**
 * Copy drink recipe to clipboard format
 */
export function copyDrinkRecipe(drink: Drink): string {
  const recipe = {
    name: drink.name,
    glass: drink.glass,
    backdrop: drink.backdrop,
    base: drink.base,
    flavors: drink.flavors,
    toppings: drink.toppings,
    mixMode: drink.mixMode,
    ...(drink.mixMode === 'blend' ? { color: drink.color } : { layers: drink.layers }),
    font: drink.font,
  };

  return JSON.stringify(recipe, null, 2);
}

/**
 * Generate deep link to try drink in game
 */
export function generateTryInGameLink(drinkId: string): string {
  const baseUrl = `https://reddit.com/r/${context.subredditName || 'bitpixis_bar_dev'}`;
  return `${baseUrl}?playtest=bitpixis-bar&drink=${drinkId}`;
}

/**
 * Get featured menu statistics
 */
async function getFeaturedMenuStats(): Promise<{
  totalDrinks: number;
  totalComponents: number;
  activeVoters: number;
}> {
  try {
    const [
      pendingDrinks,
      featuredDrinks,
      pendingComponents,
      approvedComponents,
    ] = await Promise.all([
      redis.zCard('drinks:pending'),
      redis.zCard('drinks:featured'),
      redis.zCard('components:pending'),
      redis.zCard('components:approved'),
    ]);

    return {
      totalDrinks: pendingDrinks + featuredDrinks,
      totalComponents: pendingComponents + approvedComponents,
      activeVoters: 0, // Would need more complex tracking
    };

  } catch (error) {
    console.error('❌ Failed to get featured menu stats:', error);
    return {
      totalDrinks: 0,
      totalComponents: 0,
      activeVoters: 0,
    };
  }
}

/**
 * Generate featured menu post body
 */
async function generateFeaturedMenuBody(): Promise<string> {
  const menuData = await getFeaturedMenuData();
  const parts: string[] = [];

  parts.push('🍹 **Welcome to Bitpixi\'s Bar!**');
  parts.push('');
  parts.push('*A cozy drink-making game where creativity meets community*');
  parts.push('');

  // Game launch button
  parts.push('🎮 **[▶️ PLAY GAME](https://reddit.com/r/bitpixis_bar_dev?playtest=bitpixis-bar)**');
  parts.push('');

  // Featured drinks section
  parts.push('## ⭐ Featured Drinks');
  parts.push('*The community\'s top-rated creations*');
  parts.push('');

  if (menuData.topDrinks.length > 0) {
    for (let i = 0; i < Math.min(3, menuData.topDrinks.length); i++) {
      const drink = menuData.topDrinks[i];
      const medal = ['🥇', '🥈', '🥉'][i];
      
      parts.push(`${medal} **${drink.name}** (${drink.score} votes)`);
      parts.push(`   *${formatDrinkSummary(drink.recipe)}*`);
      parts.push(`   👤 u/${drink.authorUid} | 📋 [Copy Recipe](#copy-${drink.id}) | 🎮 [Try in Game](${generateTryInGameLink(drink.id)})`);
      parts.push('');
    }
  } else {
    // Show default drinks if no community drinks yet
    const defaultDrinks = await getDefaultFeaturedDrinks();
    for (let i = 0; i < 3; i++) {
      const drink = defaultDrinks[i];
      const medal = ['🥇', '🥈', '🥉'][i];
      
      parts.push(`${medal} **${drink.name}** (Default)`);
      parts.push(`   *${formatDrinkSummary(drink.recipe)}*`);
      parts.push(`   👤 Official | 📋 [Copy Recipe](#copy-${drink.id}) | 🎮 [Try in Game](${generateTryInGameLink(drink.id)})`);
      parts.push('');
    }
  }

  // Recent components section
  parts.push('## 🎨 Recently Approved Components');
  parts.push('*New additions to the game*');
  parts.push('');

  if (menuData.recentComponents.length > 0) {
    for (const component of menuData.recentComponents.slice(0, 3)) {
      parts.push(`• **${component.name}** (${formatComponentType(component.type)})`);
      parts.push(`  *${component.description}*`);
      parts.push(`  👤 u/${component.authorUid}`);
      parts.push('');
    }
  } else {
    parts.push('*No custom components approved yet. Be the first to create one!*');
    parts.push('');
  }

  // Top creators leaderboard
  parts.push('## 🏆 Top Creators');
  parts.push('');

  if (menuData.topCreators.length > 0) {
    for (let i = 0; i < Math.min(5, menuData.topCreators.length); i++) {
      const creator = menuData.topCreators[i];
      const position = i + 1;
      const medal = position <= 3 ? ['🥇', '🥈', '🥉'][i] : `${position}.`;
      
      parts.push(`${medal} u/${creator.uid} - ${creator.totalScore} points (${creator.drinksCreated} drinks)`);
    }
  } else {
    parts.push('*No creators yet. Start making drinks to claim the top spot!*');
  }
  parts.push('');

  // Game stats
  parts.push('## 📊 Community Stats');
  parts.push('');
  parts.push(`🍹 **${menuData.stats.totalDrinks}** drinks created`);
  parts.push(`🎨 **${menuData.stats.totalComponents}** custom components`);
  parts.push(`👥 **${menuData.stats.activeVoters}** active voters`);
  parts.push('');

  // How to play
  parts.push('## 🎯 How to Play');
  parts.push('');
  parts.push('1. **🎮 Launch the game** using the play button above');
  parts.push('2. **🍹 Create drinks** by mixing ingredients and choosing styles');
  parts.push('3. **📤 Submit to Reddit** for community voting');
  parts.push('4. **🗳️ Vote on others** to help great creations get featured');
  parts.push('5. **🎨 Unlock custom components** after your first drink');
  parts.push('6. **⭐ Get featured** with +25 votes to appear behind the bartender');
  parts.push('');

  // Footer
  parts.push('---');
  parts.push('');
  parts.push('**Game Features:**');
  parts.push('• 🎨 Multiple aesthetic themes (girly, spooky, cyberpunk)');
  parts.push('• 🥃 5 glass types, 4 backdrops, 5 base ingredients');
  parts.push('• 🌀 Blend or layer your drinks with custom colors');
  parts.push('• ✍️ 5 font styles for drink names');
  parts.push('• 🏗️ Create custom components after 1 drink');
  parts.push('• 🏆 Community voting and leaderboards');
  parts.push('');
  parts.push('*Built with ❤️ using Kiro\'s spec-driven development*');

  return parts.join('\n');
}

/**
 * Format drink for summary display
 */
function formatDrinkSummary(drink: Drink): string {
  const parts = [
    `${drink.mixMode} ${drink.base}`,
    `in a ${drink.glass}`,
  ];

  if (drink.flavors.length > 0) {
    parts.push(`with ${drink.flavors.slice(0, 2).join(' & ')}`);
  }

  return parts.join(' ');
}

/**
 * Format component type for display
 */
function formatComponentType(type: string): string {
  const formats: Record<string, string> = {
    glass: '🥃 Glass',
    backdrop: '🖼️ Backdrop',
    flavor: '🍯 Flavor',
    topping: '🍒 Topping',
  };
  return formats[type] || type;
}

// Import redis from Devvit
import { redis } from '@devvit/web/server';

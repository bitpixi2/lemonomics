/**
 * Vote Feed Post Component
 * 
 * Community voting dashboard for all submissions (drinks and components).
 * Provides tabbed interface with pagination and live score updates.
 */

import type { Drink } from '@bitpixis-bar/types';
import { context, reddit } from '@devvit/web/server';
import { redisService } from '../services/redis-service.js';
import { 
  getDrinkPostData, 
  handleDrinkVote, 
  getUserDrinkVote 
} from './submit-drink-post.js';
import { 
  getPendingComponents, 
  handleComponentVote, 
  type CustomComponent 
} from './submit-component-post.js';

export interface VoteFeedItem {
  id: string;
  type: 'drink' | 'component';
  title: string;
  description: string;
  score: number;
  state: string;
  authorUid: string;
  createdAt: number;
  thumbUrl?: string;
  userVote?: 1 | -1 | null;
}

export interface VoteFeedResponse {
  items: VoteFeedItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * Create a vote feed post on Reddit
 */
export async function createVoteFeedPost(): Promise<{ postId: string; subreddit: string }> {
  try {
    const title = '[Bitpixi\'s Bar] Vote on Community Creations';
    const body = generateVoteFeedBody();

    const post = await reddit.submitPost({
      title,
      text: body,
      subredditName: context.subredditName || 'bitpixis_bar_dev',
    });

    console.log(`✅ Created vote feed post: ${post.id}`);

    return {
      postId: post.id,
      subreddit: context.subredditName || 'bitpixis_bar_dev',
    };

  } catch (error) {
    console.error('❌ Failed to create vote feed post:', error);
    throw new Error(`Failed to create vote feed post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get vote feed data for drinks
 */
export async function getDrinkVoteFeed(
  userId: string,
  page = 0,
  limit = 10
): Promise<VoteFeedResponse> {
  try {
    const offset = page * limit;
    const pendingDrinks = await redisService.getPendingDrinks(limit + 1, offset); // +1 to check hasMore

    const items: VoteFeedItem[] = [];
    
    for (const drinkInfo of pendingDrinks.slice(0, limit)) {
      const drinkData = await getDrinkPostData(drinkInfo.drinkId);
      if (!drinkData) continue;

      const userVote = await getUserDrinkVote(drinkInfo.drinkId, userId);

      items.push({
        id: drinkInfo.drinkId,
        type: 'drink',
        title: drinkData.drink.name,
        description: formatDrinkDescription(drinkData.drink),
        score: drinkData.metadata.score,
        state: drinkData.metadata.state,
        authorUid: drinkData.metadata.authorUid,
        createdAt: drinkData.metadata.createdAt,
        thumbUrl: drinkData.metadata.thumbUrl,
        userVote,
      });
    }

    return {
      items,
      totalCount: items.length, // Simplified - would need separate count query
      hasMore: pendingDrinks.length > limit,
      currentPage: page,
    };

  } catch (error) {
    console.error('❌ Failed to get drink vote feed:', error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      currentPage: page,
    };
  }
}

/**
 * Get vote feed data for components
 */
export async function getComponentVoteFeed(
  userId: string,
  page = 0,
  limit = 10
): Promise<VoteFeedResponse> {
  try {
    const pendingComponents = await getPendingComponents(limit * (page + 1));
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const pageComponents = pendingComponents.slice(startIndex, endIndex);

    const items: VoteFeedItem[] = [];
    
    for (const component of pageComponents) {
      const userVote = await getUserComponentVote(component.id, userId);

      items.push({
        id: component.id,
        type: 'component',
        title: component.name,
        description: `${formatComponentType(component.type)}: ${component.description}`,
        score: await getComponentScore(component.id),
        state: await getComponentState(component.id),
        authorUid: component.authorUid,
        createdAt: component.createdAt,
        thumbUrl: component.imageUrl,
        userVote,
      });
    }

    return {
      items,
      totalCount: pendingComponents.length,
      hasMore: pendingComponents.length > endIndex,
      currentPage: page,
    };

  } catch (error) {
    console.error('❌ Failed to get component vote feed:', error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      currentPage: page,
    };
  }
}

/**
 * Process a vote on any item (drink or component)
 */
export async function processVote(
  itemId: string,
  itemType: 'drink' | 'component',
  userId: string,
  voteDirection: 1 | -1
): Promise<{
  success: boolean;
  newScore: number;
  newState: string;
  message?: string;
}> {
  try {
    if (itemType === 'drink') {
      return await handleDrinkVote(itemId, userId, voteDirection);
    } else {
      return await handleComponentVote(itemId, userId, voteDirection);
    }
  } catch (error) {
    console.error('❌ Failed to process vote:', error);
    return {
      success: false,
      newScore: 0,
      newState: 'PENDING',
      message: 'Failed to process vote. Please try again.',
    };
  }
}

/**
 * Get combined vote feed (drinks and components mixed)
 */
export async function getCombinedVoteFeed(
  userId: string,
  page = 0,
  limit = 10
): Promise<VoteFeedResponse> {
  try {
    const [drinkFeed, componentFeed] = await Promise.all([
      getDrinkVoteFeed(userId, 0, Math.ceil(limit / 2)),
      getComponentVoteFeed(userId, 0, Math.ceil(limit / 2)),
    ]);

    // Combine and sort by creation time (newest first)
    const allItems = [...drinkFeed.items, ...componentFeed.items]
      .sort((a, b) => b.createdAt - a.createdAt);

    // Paginate combined results
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const pageItems = allItems.slice(startIndex, endIndex);

    return {
      items: pageItems,
      totalCount: allItems.length,
      hasMore: allItems.length > endIndex,
      currentPage: page,
    };

  } catch (error) {
    console.error('❌ Failed to get combined vote feed:', error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      currentPage: page,
    };
  }
}

/**
 * Get vote feed statistics
 */
export async function getVoteFeedStats(): Promise<{
  pendingDrinks: number;
  pendingComponents: number;
  featuredDrinks: number;
  approvedComponents: number;
  totalVotesToday: number;
}> {
  try {
    const [
      pendingDrinksCount,
      pendingComponentsCount,
      featuredDrinksCount,
      approvedComponentsCount,
    ] = await Promise.all([
      redis.zCard('drinks:pending'),
      redis.zCard('components:pending'),
      redis.zCard('drinks:featured'),
      redis.zCard('components:approved'),
    ]);

    // Calculate votes today (simplified)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    // This would need a more sophisticated implementation to count actual votes
    const totalVotesToday = 0; // Placeholder

    return {
      pendingDrinks: pendingDrinksCount,
      pendingComponents: pendingComponentsCount,
      featuredDrinks: featuredDrinksCount,
      approvedComponents: approvedComponentsCount,
      totalVotesToday,
    };

  } catch (error) {
    console.error('❌ Failed to get vote feed stats:', error);
    return {
      pendingDrinks: 0,
      pendingComponents: 0,
      featuredDrinks: 0,
      approvedComponents: 0,
      totalVotesToday: 0,
    };
  }
}

// Helper functions

/**
 * Generate vote feed post body
 */
function generateVoteFeedBody(): string {
  const parts: string[] = [];

  parts.push('🗳️ **Community Voting Dashboard**');
  parts.push('');
  parts.push('Help decide what gets featured in Bitpixi\'s Bar!');
  parts.push('');
  parts.push('**How to Vote:**');
  parts.push('👍 **Upvote** - Promote great creations');
  parts.push('👎 **Downvote** - Filter out poor quality');
  parts.push('');
  parts.push('**Thresholds:**');
  parts.push('🍹 **Drinks:** +25 votes → Featured | -5 votes → Retired');
  parts.push('🎨 **Components:** +15 votes → Approved | -10 votes → Rejected');
  parts.push('');
  parts.push('**Rate Limits:**');
  parts.push('• 10 votes per minute per user');
  parts.push('• Vote responsibly and fairly');
  parts.push('');
  parts.push('---');
  parts.push('*Use the game client to view and vote on specific items*');
  parts.push('');
  parts.push('🎮 **[Launch Bitpixi\'s Bar](https://reddit.com/r/bitpixis_bar_dev)**');

  return parts.join('\n');
}

/**
 * Format drink description for vote feed
 */
function formatDrinkDescription(drink: Drink): string {
  const parts = [
    `${drink.mixMode} ${drink.base}`,
    `in a ${drink.glass}`,
  ];

  if (drink.flavors.length > 0) {
    parts.push(`with ${drink.flavors.join(', ')}`);
  }

  if (drink.toppings.length > 0) {
    parts.push(`topped with ${drink.toppings.join(', ')}`);
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

/**
 * Get user's vote on a component
 */
async function getUserComponentVote(componentId: string, userId: string): Promise<1 | -1 | null> {
  try {
    const vote = await redis.hGet(`component:votes:${componentId}`, userId);
    if (!vote) return null;
    const voteValue = parseInt(vote);
    return voteValue === 1 ? 1 : voteValue === -1 ? -1 : null;
  } catch (error) {
    console.error('❌ Failed to get user component vote:', error);
    return null;
  }
}

/**
 * Get component score
 */
async function getComponentScore(componentId: string): Promise<number> {
  try {
    const score = await redis.hGet(`component:${componentId}`, 'score');
    return parseInt(score || '0');
  } catch (error) {
    console.error('❌ Failed to get component score:', error);
    return 0;
  }
}

/**
 * Get component state
 */
async function getComponentState(componentId: string): Promise<string> {
  try {
    const state = await redis.hGet(`component:${componentId}`, 'state');
    return state || 'PENDING';
  } catch (error) {
    console.error('❌ Failed to get component state:', error);
    return 'PENDING';
  }
}

// Import redis from Devvit
import { redis } from '@devvit/web/server';

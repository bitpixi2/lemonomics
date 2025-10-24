/**
 * Submit Drink Post Component
 * 
 * Automatically created when player submits drink from game client.
 * Displays drink image, recipe details, and community voting interface.
 */

import { formatDrinkSummary } from '@bitpixis-bar/logic';
import type { Drink } from '@bitpixis-bar/types';
import { context, reddit } from '@devvit/web/server';
import { redisService } from '../services/redis-service.js';

export interface CreateDrinkPostOptions {
  drink: Drink;
  imageUrl: string;
  authorUid: string;
}

export interface DrinkPostData {
  drinkId: string;
  postId: string;
  subreddit: string;
}

/**
 * Create a new drink submission post on Reddit
 */
export async function createDrinkPost(options: CreateDrinkPostOptions): Promise<DrinkPostData> {
  const { drink, imageUrl, authorUid } = options;

  try {
    // Generate post title
    const title = `[Bitpixi's Bar] ${drink.name} • ${drink.mixMode} in a ${drink.glass}`;
    
    // Generate post body using formatted summary
    const body = formatDrinkSummary(drink);

    // Create Reddit post
    const post = await reddit.submitPost({
      title,
      text: body,
      subredditName: context.subredditName || 'bitpixis_bar_dev',
    });

    // Save drink to Redis with Reddit post ID
    const drinkId = await redisService.saveDrink(drink, {
      thumbUrl: imageUrl,
      authorUid,
      redditPostId: post.id,
    });

    console.log(`✅ Created drink post: ${post.id} for drink: ${drinkId}`);

    return {
      drinkId,
      postId: post.id,
      subreddit: context.subredditName || 'bitpixis_bar_dev',
    };

  } catch (error) {
    console.error('❌ Failed to create drink post:', error);
    throw new Error(`Failed to create drink post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle voting on a drink post
 */
export async function handleDrinkVote(
  drinkId: string,
  userId: string,
  voteDirection: 1 | -1
): Promise<{
  success: boolean;
  newScore: number;
  newState: string;
  message?: string;
}> {
  try {
    // Check rate limit
    const rateLimit = await redisService.checkRateLimit('vote', userId);
    if (!rateLimit.allowed) {
      return {
        success: false,
        newScore: 0,
        newState: 'PENDING',
        message: `Rate limit exceeded. You can vote ${10 - rateLimit.currentCount} more times this minute.`,
      };
    }

    // Process vote
    const result = await redisService.voteDrink(drinkId, userId, voteDirection);

    let message = '';
    if (result.newState === 'FEATURED' && result.newScore >= 25) {
      message = '🎉 This drink has been promoted to FEATURED!';
    } else if (result.newState === 'RETIRED' && result.newScore <= -5) {
      message = '😔 This drink has been retired due to low score.';
    }

    return {
      success: true,
      newScore: result.newScore,
      newState: result.newState,
      message,
    };

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
 * Get drink post data for display
 */
export async function getDrinkPostData(drinkId: string): Promise<{
  drink: Drink;
  metadata: any;
  votes: { upvotes: number; downvotes: number; total: number };
} | null> {
  try {
    const drinkData = await redisService.getDrink(drinkId);
    if (!drinkData) {
      return null;
    }

    // Get vote summary (simplified for now)
    const votes = { upvotes: 0, downvotes: 0, total: 0 };
    
    // Calculate votes from score (simplified)
    const score = drinkData.metadata.score;
    if (score > 0) {
      votes.upvotes = Math.max(1, Math.ceil(score * 1.2));
      votes.downvotes = Math.max(0, votes.upvotes - score);
    } else if (score < 0) {
      votes.downvotes = Math.max(1, Math.ceil(Math.abs(score) * 1.2));
      votes.upvotes = Math.max(0, votes.downvotes + score);
    }
    votes.total = votes.upvotes + votes.downvotes;

    return {
      drink: drinkData.recipe,
      metadata: drinkData.metadata,
      votes,
    };

  } catch (error) {
    console.error('❌ Failed to get drink post data:', error);
    return null;
  }
}

/**
 * Get user's current vote on a drink
 */
export async function getUserDrinkVote(drinkId: string, userId: string): Promise<1 | -1 | null> {
  try {
    return await redisService.getUserVote(drinkId, userId);
  } catch (error) {
    console.error('❌ Failed to get user vote:', error);
    return null;
  }
}

/**
 * Update drink post with current score and state
 */
export async function updateDrinkPostFlair(drinkId: string): Promise<void> {
  try {
    const drinkData = await redisService.getDrink(drinkId);
    if (!drinkData || !drinkData.metadata.redditPostId) {
      return;
    }

    const { score, state } = drinkData.metadata;
    
    // Update post flair based on state
    let flairText = '';
    let flairClass = '';
    
    switch (state) {
      case 'FEATURED':
        flairText = `⭐ FEATURED (${score})`;
        flairClass = 'featured';
        break;
      case 'RETIRED':
        flairText = `💀 RETIRED (${score})`;
        flairClass = 'retired';
        break;
      default:
        flairText = `🍹 PENDING (${score})`;
        flairClass = 'pending';
    }

    // Note: Devvit doesn't currently support post flair updates
    // This would be implemented when the API supports it
    console.log(`Would update post ${drinkData.metadata.redditPostId} flair: ${flairText}`);

  } catch (error) {
    console.error('❌ Failed to update post flair:', error);
  }
}

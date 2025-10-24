/**
 * Submit Component Post Component
 * 
 * Created when players submit custom components (glasses, backdrops, flavors, toppings).
 * Handles community voting for component approval into the system pool.
 */

import type { PlayerStats } from '@bitpixis-bar/types';
import { context, reddit } from '@devvit/web/server';
import { redisService } from '../services/redis-service.js';

export type ComponentType = 'glass' | 'backdrop' | 'flavor' | 'topping';

export interface CustomComponent {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  imageUrl?: string;
  data: any; // Component-specific data
  authorUid: string;
  createdAt: number;
}

export interface CreateComponentPostOptions {
  component: CustomComponent;
  authorUid: string;
}

export interface ComponentPostData {
  componentId: string;
  postId: string;
  subreddit: string;
}

/**
 * Create a new custom component submission post on Reddit
 */
export async function createComponentPost(options: CreateComponentPostOptions): Promise<ComponentPostData> {
  const { component, authorUid } = options;

  try {
    // Check if user has unlocked custom components
    const hasUnlocked = await redisService.getPlayerStats(authorUid);
    if (!hasUnlocked || !hasUnlocked.customComponentsUnlocked) {
      throw new Error('Custom components not unlocked. Create a drink first!');
    }

    // Check rate limit for component submissions
    const rateLimit = await redisService.checkRateLimit('component', authorUid);
    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded. You can submit 1 component every 10 minutes.');
    }

    // Generate post title
    const title = `[Bitpixi's Bar] New ${component.type}: ${component.name}`;
    
    // Generate post body
    const body = formatComponentDescription(component);

    // Create Reddit post
    const post = await reddit.submitPost({
      title,
      text: body,
      subredditName: context.subredditName || 'bitpixis_bar_dev',
    });

    // Save component to Redis
    const componentId = await saveCustomComponent(component, post.id);

    console.log(`✅ Created component post: ${post.id} for component: ${componentId}`);

    return {
      componentId,
      postId: post.id,
      subreddit: context.subredditName || 'bitpixis_bar_dev',
    };

  } catch (error) {
    console.error('❌ Failed to create component post:', error);
    throw new Error(`Failed to create component post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle voting on a custom component
 */
export async function handleComponentVote(
  componentId: string,
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

    // Get current component data
    const componentData = await getCustomComponent(componentId);
    if (!componentData) {
      return {
        success: false,
        newScore: 0,
        newState: 'PENDING',
        message: 'Component not found.',
      };
    }

    // Process vote (similar to drink voting but with different thresholds)
    const result = await voteOnComponent(componentId, userId, voteDirection);

    let message = '';
    if (result.newState === 'APPROVED' && result.newScore >= 15) {
      message = '🎉 This component has been approved and added to the system pool!';
      await addComponentToSystemPool(componentId);
    } else if (result.newState === 'REJECTED' && result.newScore <= -10) {
      message = '😔 This component has been rejected.';
    }

    return {
      success: true,
      newScore: result.newScore,
      newState: result.newState,
      message,
    };

  } catch (error) {
    console.error('❌ Failed to process component vote:', error);
    return {
      success: false,
      newScore: 0,
      newState: 'PENDING',
      message: 'Failed to process vote. Please try again.',
    };
  }
}

/**
 * Get approved components for use in the game
 */
export async function getApprovedComponents(type?: ComponentType): Promise<CustomComponent[]> {
  try {
    // Get approved component IDs from sorted set
    const approvedIds = await redis.zRange('components:approved', 0, -1, { reverse: true, by: 'rank' });
    
    if (approvedIds.length === 0) {
      return [];
    }

    // Get component data for each ID
    const components: CustomComponent[] = [];
    
    for (const result of approvedIds) {
      const componentId = result.member;
      const component = await getCustomComponent(componentId);
      
      if (component && (!type || component.type === type)) {
        components.push(component);
      }
    }

    return components;

  } catch (error) {
    console.error('❌ Failed to get approved components:', error);
    return [];
  }
}

/**
 * Get pending components for voting
 */
export async function getPendingComponents(limit = 20): Promise<CustomComponent[]> {
  try {
    const pendingIds = await redis.zRange('components:pending', 0, limit - 1, { reverse: true, by: 'rank' });
    
    const components: CustomComponent[] = [];
    
    for (const result of pendingIds) {
      const componentId = result.member;
      const component = await getCustomComponent(componentId);
      
      if (component) {
        components.push(component);
      }
    }

    return components;

  } catch (error) {
    console.error('❌ Failed to get pending components:', error);
    return [];
  }
}

// Helper functions

/**
 * Format component description for Reddit post
 */
function formatComponentDescription(component: CustomComponent): string {
  const parts: string[] = [];

  parts.push(`🎨 **${component.name}**`);
  parts.push('');
  parts.push(`**Type:** ${formatComponentType(component.type)}`);
  parts.push(`**Description:** ${component.description}`);
  parts.push('');

  // Add type-specific details
  switch (component.type) {
    case 'glass':
      parts.push('**Usage:** This glass design will be available for all drink creations.');
      break;
    case 'backdrop':
      parts.push('**Usage:** This backdrop will be available as a scene option.');
      break;
    case 'flavor':
      parts.push('**Usage:** This flavor will be available as an ingredient option.');
      break;
    case 'topping':
      parts.push('**Usage:** This topping will be available for drink decoration.');
      break;
  }

  parts.push('');
  parts.push('**Vote to approve this component for the game!**');
  parts.push('👍 Approve | 👎 Reject');
  parts.push('');
  parts.push('---');
  parts.push('*Created with Bitpixi Bar* 🎮');

  return parts.join('\n');
}

/**
 * Format component type for display
 */
function formatComponentType(type: ComponentType): string {
  const formats: Record<ComponentType, string> = {
    glass: '🥃 Glass Design',
    backdrop: '🖼️ Backdrop Scene',
    flavor: '🍯 Flavor Ingredient',
    topping: '🍒 Drink Topping',
  };
  return formats[type] || type;
}

/**
 * Save custom component to Redis
 */
async function saveCustomComponent(component: CustomComponent, redditPostId: string): Promise<string> {
  const componentId = generateComponentId(component);
  const timestamp = Date.now();

  // Save component metadata
  await redis.hSet(`component:${componentId}`, {
    type: component.type,
    name: component.name,
    description: component.description,
    state: 'PENDING',
    score: '0',
    authorUid: component.authorUid,
    createdAt: timestamp.toString(),
    redditPostId,
    imageUrl: component.imageUrl || '',
  });

  // Save component data
  await redis.set(`component:${componentId}:data`, JSON.stringify(component.data));

  // Add to pending list
  await redis.zAdd('components:pending', { member: componentId, score: timestamp });

  return componentId;
}

/**
 * Get custom component by ID
 */
async function getCustomComponent(componentId: string): Promise<CustomComponent | null> {
  try {
    const [metadata, dataJson] = await Promise.all([
      redis.hGetAll(`component:${componentId}`),
      redis.get(`component:${componentId}:data`),
    ]);

    if (!metadata || !dataJson) {
      return null;
    }

    return {
      id: componentId,
      type: metadata.type as ComponentType,
      name: metadata.name,
      description: metadata.description,
      imageUrl: metadata.imageUrl || undefined,
      data: JSON.parse(dataJson),
      authorUid: metadata.authorUid,
      createdAt: parseInt(metadata.createdAt),
    };

  } catch (error) {
    console.error('❌ Failed to get custom component:', error);
    return null;
  }
}

/**
 * Vote on a component (simplified version)
 */
async function voteOnComponent(componentId: string, userId: string, voteDirection: 1 | -1) {
  // Get current vote
  const currentVote = await redis.hGet(`component:votes:${componentId}`, userId);
  const previousVote = currentVote ? parseInt(currentVote) : 0;
  
  // Calculate score change
  const scoreChange = voteDirection - previousVote;
  
  if (scoreChange === 0) {
    const currentScore = await redis.hGet(`component:${componentId}`, 'score');
    const currentState = await redis.hGet(`component:${componentId}`, 'state');
    return {
      newScore: parseInt(currentScore || '0'),
      newState: currentState || 'PENDING',
      previousVote,
    };
  }

  // Update vote
  await redis.hSet(`component:votes:${componentId}`, userId, voteDirection.toString());

  // Update score
  const newScore = await redis.hIncrBy(`component:${componentId}`, 'score', scoreChange);

  // Check for state transitions (different thresholds than drinks)
  let newState = await redis.hGet(`component:${componentId}`, 'state') || 'PENDING';
  
  if (newState === 'PENDING') {
    if (newScore >= 15) { // Lower threshold for component approval
      newState = 'APPROVED';
      await redis.hSet(`component:${componentId}`, 'state', newState);
      await redis.zRem('components:pending', componentId);
      await redis.zAdd('components:approved', { member: componentId, score: newScore });
    } else if (newScore <= -10) { // Higher threshold for rejection
      newState = 'REJECTED';
      await redis.hSet(`component:${componentId}`, 'state', newState);
      await redis.zRem('components:pending', componentId);
    } else {
      await redis.zAdd('components:pending', { member: componentId, score: newScore });
    }
  }

  return {
    newScore,
    newState,
    previousVote,
  };
}

/**
 * Add approved component to system pool
 */
async function addComponentToSystemPool(componentId: string): Promise<void> {
  // This would integrate with the game's component system
  // For now, just log the approval
  console.log(`✅ Component ${componentId} approved and added to system pool`);
}

/**
 * Generate component ID
 */
function generateComponentId(component: CustomComponent): string {
  const timestamp = Date.now();
  const components = [
    component.type,
    component.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
  ].join('-');

  return `${components}-${timestamp.toString(36)}`.substring(0, 100);
}

// Import redis from Devvit for the helper functions
import { redis } from '@devvit/web/server';

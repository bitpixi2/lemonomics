import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration
      appDisplayName: 'Lemonomics',
      backgroundUri: 'lemonomics-banner.png',
      buttonLabel: '🍋 Clock into Work',
      description: 'The Most Addictive Lemonade Stand Business Simulator',
      entryUri: 'index.html',
      heading: 'Welcome to Lemonomics!',
      appIconUri: 'lemon-icon.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: '🍋 Welcome to Lemonomics! 🍋',
  });
};

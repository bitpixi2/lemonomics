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
      backgroundUri: 'splash-background.png',
      buttonLabel: '🍋 Start Your Stand',
      description: '',
      entryUri: 'index.html',
      heading: '',
      appIconUri: 'app-icon.png',
    } as any,
    postData: {
      gameType: 'lemonade-stand',
      version: '1.0.0',
    },
    subredditName: subredditName,
    title: '🍋 Lemonomics - Lemonade Stand Business Game',
  });
};

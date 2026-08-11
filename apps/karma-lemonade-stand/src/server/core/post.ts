import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    postData: {
      gameType: 'lemonade-stand',
      version: '1.1.0',
    },
    subredditName: subredditName,
    title: '🍋 Lemonomics - Lemonade Stand Business Game',
  });
};

import { Devvit } from '@devvit/public-api';
import { createPost } from './server/core/post.js';

// Configure Devvit for Web App
Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add menu action for moderators to create posts
Devvit.addMenuItem({
  label: 'Create Lemonomics Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { ui } = context;

    try {
      await createPost();

      ui.showToast({
        text: 'Lemonomics post created successfully!',
        appearance: 'success',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      ui.showToast({
        text: 'Failed to create post. Please try again.',
        appearance: 'neutral',
      });
    }
  },
});

export default Devvit;

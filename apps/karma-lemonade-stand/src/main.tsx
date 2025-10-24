import { Devvit } from '@devvit/public-api';

// Configure Devvit
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Add menu action for moderators to create posts
Devvit.addMenuItem({
  label: '🍋 Create Lemonomics Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();

      // Create a text post that will be converted to a webview post by Devvit
      await reddit.submitPost({
        title: '🍋 Welcome to Lemonomics! 🍋',
        text: 'Click to start your lemonade stand business!',
        subredditName: subreddit.name,
      });

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

// Handle app installation
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_event, context) => {
    const { reddit } = context;
    
    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      // Create welcome post on installation
      await reddit.submitPost({
        title: '🍋 Lemonomics is now installed! Welcome to the lemonade business! 🍋',
        text: 'Your community can now play the most addictive lemonade stand game! Moderators can create game posts using the subreddit menu.',
        subredditName: subreddit.name,
      });
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  },
});

export default Devvit;

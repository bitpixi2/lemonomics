import { Devvit } from '@devvit/public-api';

// Configure Devvit
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Add the main post component that shows the game preview and launch button
Devvit.addCustomPostType({
  name: 'Lemonomics Game',
  height: 'regular',
  render: (context) => {
    const { useState } = context;
    const [gameStarted, setGameStarted] = useState(false);

    if (gameStarted) {
      return (
        <webview
          id="lemonomics-game"
          url="index.html"
          width="100%"
          height="100%"
        />
      );
    }

    return (
      <vstack
        height="100%"
        width="100%"
        alignment="center middle"
        gap="medium"
        padding="large"
      >
        {/* Background banner image */}
        <image
          url="assets/lemonomics-banner.png"
          description="Lemonomics Game Banner"
          width="100%"
          height="120px"
          resizeMode="cover"
        />

        <hstack gap="medium" alignment="center middle">
          {/* Lemon icon */}
          <image
            url="assets/lemon-icon.png"
            description="Lemon Stand Icon"
            width="48px"
            height="48px"
          />

          <vstack gap="small" alignment="center">
            <text size="xxlarge" weight="bold" color="yellow">
              LEMONOMICS
            </text>
            <text size="medium" alignment="center" wrap>
              Turn your Reddit karma into lemonade profits!
            </text>
          </vstack>

          <image
            url="assets/lemon-icon.png"
            description="Lemon Stand Icon"
            width="48px"
            height="48px"
          />
        </hstack>

        <vstack gap="small" alignment="center">
          <text size="medium" color="secondary">
            Welcome, Player!
          </text>
          <text size="medium" color="secondary">
            Your karma = business advantages
          </text>
        </vstack>

        <vstack gap="small" alignment="center">
          <text size="small" color="secondary">
            🎪 Daily festivals & events
          </text>
          <text size="small" color="secondary">
            🏆 Competitive leaderboards
          </text>
          <text size="small" color="secondary">
            🎁 Daily login bonuses
          </text>
          <text size="small" color="secondary">
            💎 Power-ups & upgrades
          </text>
        </vstack>

        <button
          appearance="primary"
          size="large"
          onPress={() => {
            setGameStarted(true);
          }}
        >
          🍋 Start Your Lemonade Stand! 🍋
        </button>

        <text size="small" color="secondary" alignment="center">
          Build your empire, one cup at a time!
        </text>
      </vstack>
    );
  },
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

      // Create a custom post using our post type
      await reddit.submitPost({
        title:
          '🍋 Welcome to Lemonomics! Turn your karma into lemonade profits! 🍋',
        subredditName: subreddit.name,
        preview: (
          <vstack
            height="100%"
            width="100%"
            alignment="center middle"
            gap="medium"
            padding="large"
          >
            <image
              url="assets/lemonomics-banner.png"
              description="Lemonomics Game Banner"
              width="100%"
              height="120px"
              resizeMode="cover"
            />

            <hstack gap="medium" alignment="center middle">
              <image
                url="assets/lemon-icon.png"
                description="Lemon Stand Icon"
                width="48px"
                height="48px"
              />

              <vstack gap="small" alignment="center">
                <text size="xxlarge" weight="bold" color="yellow">
                  LEMONOMICS
                </text>
                <text size="medium" alignment="center">
                  The most addictive lemonade stand game on Reddit!
                </text>
              </vstack>

              <image
                url="assets/lemon-icon.png"
                description="Lemon Stand Icon"
                width="48px"
                height="48px"
              />
            </hstack>

            <button appearance="primary" size="large">
              🍋 Play Now! 🍋
            </button>
          </vstack>
        ),
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
        title:
          '🍋 Lemonomics is now installed! Welcome to the lemonade business! 🍋',
        text: 'Your community can now play the most addictive lemonade stand game! Moderators can create game posts using the subreddit menu.',
        subredditName: subreddit.name,
      });
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  },
});

export default Devvit;

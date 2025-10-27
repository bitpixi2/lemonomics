# Implementation Plan

- [x] 1. Set up basic project structure and video assets

  - Create clean Devvit app structure for video-based game
  - Set up public/videos directory with proper organization
  - Configure TypeScript project with client, server, and shared directories
  - Add video file references and preloading configuration
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement core data models and simple storage

  - [x] 2.1 Create shared TypeScript interfaces for game data
    - Define GameState, DayResult, and LeaderboardEntry interfaces
    - Create WeatherType enum and video asset interfaces
    - Define simple ingredient and pricing structures
    - _Requirements: 2.1, 2.2, 3.1, 4.1_

  - [x] 2.2 Implement basic Redis storage for game sessions
    - Create simple RedisClient wrapper for game state
    - Implement basic game session storage and retrieval
    - Create simple leaderboard storage functionality
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [x] 3. Create video management system

  - [x] 3.1 Implement video player component
    - ✅ Create React video player with autoplay and controls
    - ✅ Add video preloading and buffering management
    - ✅ Implement smooth transitions between video sequences
    - ✅ Handle video loading errors and fallbacks with retry logic
    - ✅ Add mobile optimization and touch-friendly controls
    - ✅ Implement fade transitions and loading states
    - _Requirements: 1.1, 3.2, 3.3, 3.4, 4.1_

  - [x] 3.2 Build video sequencing logic
    - ✅ Create VideoSequencer to manage intro → customer → money flow
    - ✅ Implement weather-based video selection
    - ✅ Add automatic progression between video phases
    - ✅ Add support for looping videos and UI overlays
    - ✅ Implement skip functionality and sequence control
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] 4. Implement game engine and logic

  - [x] 4.1 Create basic game session management
    - ✅ Implement GameSessionManager class with day progression
    - ✅ Add cash and inventory tracking with validation
    - ✅ Create ingredient purchase validation and processing
    - ✅ Add session lifecycle management (create, update, end)
    - ✅ Implement ingredient constraint checking (can make lemonade)
    - ✅ Add session cleanup for memory management
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2_

  - [x] 4.2 Build sales calculation system
    - ✅ Implement weather-based demand calculation with multipliers
    - ✅ Create ingredient-constrained sales logic (supply vs demand)
    - ✅ Add profit calculation (revenue minus ingredient costs)
    - ✅ Implement price elasticity effects on customer demand
    - ✅ Add karma boost effects on customer attraction
    - ✅ Generate dynamic customer dialogue based on performance
    - ✅ Create optimal pricing suggestions based on conditions
    - ✅ Add festival multipliers for special events
    - _Requirements: 3.5, 4.3, 4.4, 5.3_

- [x] 5. Create game interface screens

  - [x] 5.1 Build introduction screen with weather-based flow
    - ✅ Create weather-specific intro video player (sunny/windy/rainy)
    - ✅ Add "Start Game" button that appears after video
    - ✅ Implement transition to ingredient selection
    - 🔄 Display current day number on intro screen
    - ✅ Random weather generation for each day
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Create ingredient selection interface with weather overlay
    - ✅ Play weather-specific ingredient video as background (sunny/windy/rainy)
    - ✅ Overlay interactive quantity selectors for lemons, sugar, cups
    - ✅ Display current cash and real-time cost calculation
    - ✅ Add purchase validation and "Start Selling" button
    - ✅ Show current inventory and ingredient costs
    - ✅ Error handling for insufficient funds
    - 🔄 Display current day number on ingredient screen
    - ✅ Weather-appropriate background videos for immersion
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 5.3 Implement complete daily game flow with weather variations
    - ✅ Create customers screen with weather-specific customer videos (sunny/windy/rainy)
    - ✅ Add loading results screen with weather-specific animations (sunny/windy/rainy)
    - ✅ Display weather-specific results background video (sunny/windy/rainy)
    - ✅ Show day number, cups sold, revenue, costs, and profit
    - ✅ Add customer feedback based on performance and weather
    - ✅ Include three navigation buttons: "Next Day", "Restart", "Save & Post"
    - ✅ Add restart confirmation dialog
    - ✅ Weather affects customer behavior and dialogue
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.4 Create save game and post progress functionality (UI ready)
    - ✅ Build results screen with save and post button
    - 🔄 Reddit post creation (needs server implementation)
    - 🔄 Automatic subscription to r/Lemonomics (needs server implementation)
    - 🔄 Save game state persistence (needs server implementation)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.5 Create game over and leaderboard screen
    - ✅ Display final game statistics (days played, total cash)
    - ✅ Show top 10 leaderboard with player position highlighting
    - ✅ Add "Play Again" button to restart game
    - ✅ Leaderboard background video with overlay UI
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Build server API endpoints

  - [x] 6.1 Create core game endpoints
    - ✅ Build /api/start-game endpoint for new game initialization with random weather
    - ✅ Create /api/purchase-ingredients endpoint for daily purchases
    - ✅ Implement /api/end-day endpoint for sales calculation and results
    - ✅ Add weather generation and day progression logic
    - ✅ Integrate with Devvit context for user authentication
    - _Requirements: 2.1, 2.5, 4.3, 5.1_

  - [x] 6.2 Create save game and social endpoints
    - ✅ Build /api/save-game endpoint with Redis persistence
    - ✅ Create /api/resume-game endpoint for loading saved games from Redis
    - ✅ Implement /api/post-progress endpoint for Reddit post creation
    - ✅ Connect to Devvit Reddit API for post creation
    - ✅ Add proper Devvit context integration
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.3 Create leaderboard and achievement endpoints
    - ✅ Build /api/submit-score endpoint with Redis sorted sets
    - ✅ Create /api/leaderboard endpoint for top 10 players from Redis
    - ✅ Implement score validation and Redis storage
    - ✅ Add /api/check-achievements endpoint for milestone flair rewards
    - ✅ Implement automatic user flair assignment system via Reddit API:
      - $10.00 milestone → "Lemon Apprentice" (ID: `2b6eecf8-b254-11f0-8c08-226f6c7bd5e2`)
      - $100.00 milestone → "Citrus Tycoon" (ID: `7844575c-b254-11f0-8b2d-d62f5c13ad44`)
      - $1,000.00 milestone → "Global Lemonade Hero" (ID: `a776e332-b254-11f0-8d07-9eb8e1ecefd1`)
    - ✅ Full Devvit Redis integration for data persistence
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Add video asset integration

  - [x] 7.1 Organize and optimize video files
    - ✅ Place video files in public/videos with proper naming convention
    - ✅ Organize all weather variants (sunny/windy/rainy) with correct file structure
    - ✅ **Complete**: All real video files present (17/17):
      - ✅ All Intro screens (sunny: 448K, windy: 554K, rainy: 536K)
      - ✅ All Ingredient screens (sunny: 288K, windy: 324K, rainy: 335K)
      - ✅ All Customer screens (sunny: 593K, windy: 698K, rainy: 687K)
      - ✅ All Loading Results screens (sunny: 222K, windy: 247K, rainy: 255K)
      - ✅ All Results screens (sunny: 415K, windy: 443K, rainy: 420K)
      - ✅ Leaderboard screen (435K)
    - ✅ Video file loading and playback system implemented and tested
    - ✅ All weather variants properly included and optimized
    - _Requirements: 1.1, 3.2, 3.3, 3.4, 4.1, 4.2_

  - [x] 7.2 Implement video preloading strategy
    - ✅ Preload intro video on app start with configurable strategy
    - ✅ Preload weather-specific videos based on random selection
    - ✅ Add loading states and error handling for video assets
    - ✅ Mobile-optimized preloading with reduced strategy on mobile devices
    - ✅ Comprehensive error handling with retry logic
    - _Requirements: 1.1, 3.1, 4.1_

- [x] 8. Mobile optimization and responsive design

  - [x] 8.1 Optimize for mobile devices
    - ✅ **Desktop**: Wide videos display fullscreen for immersive experience
    - ✅ **Mobile**: Videos centered with left/right cropping, empty space top/bottom (not fullscreen)
    - ✅ Responsive video container with proper aspect ratio handling
    - ✅ Touch-optimized interactions with larger touch targets (44px minimum)
    - ✅ **Audio Control**: Mute/unmute button in upper-right corner with proper mobile sizing
    - ✅ Audio management system with localStorage persistence
    - ✅ Prevent text selection and tap highlights on interactive elements
    - ✅ Mobile-specific CSS with proper viewport handling
    - ✅ iOS Safari compatibility with font-size 16px to prevent zoom
    - ✅ Enhanced spacing and padding for better touch experience
    - _Requirements: All UI requirements_

- [ ] 9. Testing and polish

  - [ ] 9.1 Test complete game flow
    - Test full game sessions from intro to game over
    - Verify all weather video combinations work correctly
    - Test leaderboard functionality with multiple players
    - Validate sales calculations match expected results
    - _Requirements: All requirements validation_

  - [ ] 9.2 Performance optimization
    - Optimize video loading and playback performance
    - Test memory usage during extended play sessions
    - Ensure smooth transitions between all game phases
    - Verify game works well on slower mobile connections
    - _Requirements: Performance and user experience_

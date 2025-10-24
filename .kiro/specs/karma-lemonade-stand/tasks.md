# Implementation Plan

- [x] 1. Set up project structure and core configuration

  - Create Devvit app configuration with proper permissions for Reddit API and Payments
  - Set up TypeScript project structure with client, server, and shared directories
  - Configure build system with Vite for both client and server
  - Create global configuration schema and Redis connection setup
  - _Requirements: 12.1_

- [x] 2. Implement core data models and Redis storage

  - [x] 2.1 Create shared TypeScript interfaces for all data models

    - Define UserProfile, GameConfig, GameResult, and other core interfaces
    - Create festival theme definitions and payment receipt types
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Implement Redis storage adapters

    - Create RedisClient wrapper with connection management
    - Implement UserProfileAdapter for user data operations
    - Create ConfigAdapter for global configuration management
    - _Requirements: 12.1, 12.6_

  - [x] 2.3 Create leaderboard storage system
    - Implement LeaderboardAdapter with daily/weekly operations
    - Create separate storage for pure (no power-up) leaderboards
    - Add leaderboard maintenance and cleanup functions
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

- [x] 3. Build Reddit integration service

  - [x] 3.1 Implement Reddit user data fetching

    - Create RedditStatsService to retrieve karma, account age, and awards
    - Implement caching mechanism with TTL for user stats
    - Add error handling for Reddit API failures
    - _Requirements: 1.1_

  - [x] 3.2 Create stat conversion system

    - Implement StatConverter to transform Reddit stats to game stats
    - Apply configurable ratios for service, marketing, and reputation
    - Add validation and bounds checking for converted stats
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 3.3 Build result post generation
    - Create PostGenerator for Reddit result posts
    - Implement image generation for result cards
    - Add mobile-friendly post formatting with action buttons
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Implement game engine and scoring system

  - [x] 4.1 Create core game engine

    - Implement GameEngine class with run orchestration
    - Create deterministic seed generation based on user ID and run count
    - Add input validation for price and advertising spend
    - _Requirements: 2.1, 2.2, 8.3_

  - [x] 4.2 Build demand calculation system

    - Implement DemandCalculator with base customer calculation
    - Apply price elasticity, advertising effects, and reputation bonuses
    - Integrate weather, event, and festival modifiers
    - _Requirements: 2.3, 2.4, 3.2, 4.5_

  - [x] 4.3 Create profit calculation and result generation
    - Calculate revenue from cups sold and pricing
    - Deduct inventory costs, fixed costs, and advertising spend
    - Generate comprehensive GameResult with all contributing factors
    - _Requirements: 2.5, 2.6_

- [x] 5. Build cycle management system

  - [x] 5.1 Implement daily cycle generation

    - Create DailyCycleManager with deterministic weather generation
    - Generate market events (VIRAL, SUGAR_SHORT, INFLATION, NONE) with probabilities
    - Calculate daily lemon and sugar prices using normal distribution
    - _Requirements: 3.1, 3.3, 3.5, 3.6_

  - [x] 5.2 Create weekly festival system

    - Implement WeeklyCycleManager with 30+ festival themes
    - Organize festivals by category (holiday, aesthetic, era, genre)
    - Apply festival-specific gameplay modifiers and visual themes
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.3 Build automated reset system
    - Create scheduled tasks for daily reset at 00:05 UTC
    - Implement weekly reset on Sunday 23:55 UTC
    - Reset leaderboards, power-up counters, and generate new cycles
    - _Requirements: 12.2, 12.3_

- [x] 6. Implement login bonus system

  - [x] 6.1 Create bonus determination logic
    - Generate daily login bonuses using daily seed
    - Implement PERFECT (1.15x revenue), FREE_AD (+2 credits), COOLER (ignore cold) bonuses
    - Store bonus state in user profile with 24-hour duration
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Build payment system integration

  - [x] 7.1 Implement Devvit Payments integration

    - Set up payment processing for Super Sugar power-ups
    - Create client-side purchase flow with Devvit Payments SDK
    - Implement server-side receipt verification
    - _Requirements: 11.5_

  - [x] 7.2 Create power-up management system

    - Implement PowerupManager with effect application
    - Add daily usage limits and tracking
    - Create targeting logic for struggling players (low stats or recent losses)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 7.3 Add power-up indicators and pure leaderboards
    - Mark runs with power-up usage on leaderboards and posts
    - Create separate "Pure League" rankings for runs without power-ups
    - Add visual indicators for power-up usage in UI
    - _Requirements: 11.6, 11.7_

- [x] 8. Create rate limiting and anti-cheat system

  - [x] 8.1 Implement rate limiting

    - Create rate limiting for maximum posts per user per day
    - Add minimum seconds between runs enforcement
    - Display clear error messages and countdown timers for limits
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 8.2 Add server-side validation
    - Validate all game calculations server-side
    - Prevent client-side tampering with game results
    - Implement monitoring for suspicious patterns
    - _Requirements: 8.5_

- [x] 9. Build progress tracking system

  - [x] 9.1 Implement streak tracking

    - Track consecutive daily play streaks using UTC boundaries
    - Reset streaks when players miss a day
    - Store streak data in user profiles
    - _Requirements: 10.1, 10.4, 10.5_

  - [x] 9.2 Create personal best tracking
    - Track and update best profit scores
    - Store total runs and last play date
    - Display progress statistics in user profile
    - _Requirements: 10.2, 10.3_

- [x] 10. Develop client-side game interface

  - [x] 10.1 Create main game UI components

    - Build responsive game interface with mobile-first design
    - Create pricing and advertising input controls
    - Display current weather, events, and festival information
    - _Requirements: 2.1, 2.2_

  - [x] 10.2 Implement festival theme rendering

    - Create ThemeRenderer for visual festival themes
    - Apply themed backgrounds, UI elements, and stand decorations
    - Ensure themes work across all 30+ festival variations
    - _Requirements: 5.6_

  - [x] 10.3 Build result display and sharing

    - Create result screen showing profit, cups sold, and contributing factors
    - Display streak information and personal progress
    - Add sharing functionality for social engagement
    - _Requirements: 2.6, 10.3_

  - [x] 10.4 Create leaderboard interface
    - Build daily and weekly leaderboard displays
    - Show both regular and pure league rankings
    - Add power-up indicators and user ranking information
    - _Requirements: 7.3, 11.6, 11.7_

- [x] 11. Implement server API endpoints

  - [x] 11.1 Create game run endpoint

    - Build /api/run-game endpoint with comprehensive validation
    - Integrate all game systems (stats, cycles, festivals, power-ups)
    - Return complete game results with verification data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 11.2 Build user profile endpoints

    - Create /api/profile endpoint for user stats and progress
    - Implement /api/leaderboards for ranking data
    - Add /api/current-cycle for daily/weekly condition information
    - _Requirements: 1.1, 7.3, 10.3_

  - [x] 11.3 Create payment processing endpoints
    - Build /api/purchase endpoint for power-up purchases
    - Implement receipt verification and usage tracking
    - Add power-up status and limit checking endpoints
    - _Requirements: 11.4, 11.5, 12.6_

- [x] 12. Add monitoring and maintenance features

  - [x] 12.1 Implement system monitoring

    - Add logging for game runs, payments, and system events
    - Create health check endpoints for system status
    - Implement alerting for anomalies and errors
    - _Requirements: 12.5_

  - [x] 12.2 Create data maintenance tasks
    - Implement leaderboard archiving and cleanup
    - Add old data purging for performance
    - Create backup and recovery procedures
    - _Requirements: 7.6_

- [x] 13. Testing and deployment preparation

  - [x] 13.1 Create comprehensive test suite

    - Write unit tests for core game logic and calculations
    - Add integration tests for Reddit and payment systems
    - Create end-to-end tests for complete game flows
    - _Requirements: All requirements validation_

  - [x] 13.2 Prepare for production deployment
    - Configure production Redis and monitoring
    - Set up error tracking and analytics
    - Create deployment scripts and documentation
    - _Requirements: 12.1, 12.5_

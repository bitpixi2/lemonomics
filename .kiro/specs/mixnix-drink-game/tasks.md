# Implementation Plan

- [x] 1. Set up pnpm monorepo structure and tooling
  - Create pnpm-workspace.yaml and migrate current src/ structure to apps/
  - Set up packages/logic/, packages/redis/, packages/types/ with package.json files
  - Configure ESLint, Prettier, Vitest, and GitHub Actions for CI
  - Update build scripts to work with monorepo structure
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create YAML specifications and steering configuration
  - [x] 2.1 Create .kiro/steering.yaml with TypeScript conventions and testing requirements
    - Define language preferences, UI framework, Three.js version
    - Set code generation paths and testing coverage requirements
    - Configure determinism requirements and documentation automation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Create .kiro/specs/drink.yaml specification
    - Define drink schema with glass, backdrop, base, flavors, toppings fields
    - Configure mixMode enum with blend/layered validation rules
    - Set up color validation patterns and layer percentage constraints
    - Add font selection and name validation with banned words
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 2.3 Create .kiro/specs/shop.yaml specification
    - Define drink states (PENDING, FEATURED, RETIRED) and thresholds
    - Configure vote events and score calculation rules
    - Set up player progression system with custom component unlock
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3. Implement automated code generation hooks
  - [x] 3.1 Create validate-drink.ts hook for real-time validation
    - Implement blend mode color requirement validation
    - Add layered mode percentage sum and layer count validation
    - Validate flavor/topping limits and name constraints
    - _Requirements: 4.1_

  - [x] 3.2 Create gen-types.ts hook for type generation
    - Generate JSON Schemas from YAML specs to packages/types/src/gen
    - Generate TypeScript interfaces and types
    - Set up automatic regeneration on spec changes
    - _Requirements: 2.1, 2.2, 4.2_

  - [x] 3.3 Create gen-logic.ts hook for business logic generation
    - Generate mixColor function with deterministic seeding
    - Generate formatDrinkSummary and validateDrink functions
    - Generate layer percentage calculation helpers
    - _Requirements: 4.3, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.4 Create gen-tests.ts hook for comprehensive test generation
    - Generate Vitest suites for validation edge cases
    - Create tests for promotion/retirement thresholds
    - Add determinism tests for color blending with seeds
    - _Requirements: 4.4, 8.5_

  - [x] 3.5 Create gen-readme.ts hook for documentation automation
    - Generate "How specs → hooks → codegen works" section
    - Create workflow diagrams and append to CHANGELOG.md
    - _Requirements: 4.5_

- [x] 4. Implement Redis data persistence layer
  - [x] 4.1 Set up Redis client and connection management
    - Configure ioredis client with connection pooling
    - Set up Redis key structure for drinks, votes, and player stats
    - Implement connection error handling and retry logic
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Create Lua scripts for atomic operations
    - Write voteDrink.lua for idempotent vote processing with Reddit sync
    - Write rateLimit.lua for sliding window rate limiting
    - Write promoteRetire.lua for automatic state transitions
    - Write syncRedditVotes.lua for batch Reddit vote synchronization
    - _Requirements: 5.4_

  - [x] 4.3 Implement typed Redis adapters
    - Create saveDrink adapter with thumbnail and author tracking
    - Implement voteDrink adapter with score aggregation
    - Build getDrink and getFeatured query adapters
    - Add player progression tracking adapters
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 5. Create Devvit post components for Reddit integration
  - [x] 5.1 Implement SubmitDrinkPost component
    - Create automatic post generation from game client submissions
    - Display drink image, recipe details, and creator information
    - Implement community voting interface with real-time score updates
    - _Requirements: 6.1_

  - [x] 5.2 Implement SubmitComponentPost component
    - Create post type for custom component submissions (Phase 3)
    - Display component preview and usage demonstration
    - Implement voting system for component approval
    - _Requirements: 6.1, 10.2, 10.3_

  - [x] 5.3 Implement VoteFeedPost component
    - Create tabbed interface for drinks and components
    - Build paginated list with thumbnails and voting buttons
    - Implement rate limiting and live score updates
    - _Requirements: 6.2, 6.3_

  - [x] 5.4 Implement FeaturedMenuPost component
    - Display top 3 featured drinks matching bar scene
    - Show recently approved custom components
    - Add "Play Game" launch button and deep linking
    - Implement recipe copying and creator leaderboards
    - _Requirements: 6.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 6. Build Three.js client with progressive phases
  - [x] 6.1 Set up scene management and camera system
    - Create SceneManager with bar, mixing, and component-design scenes
    - Implement smooth transitions between view states
    - Set up featured drinks display behind bartender in bar scene
    - _Requirements: 7.1_

  - [x] 6.2 Implement drink rendering system
    - Load and cache glass models for reuse
    - Create blend mode rendering with single colored cylinder
    - Implement layered mode with multiple stacked cylinders
    - Add backdrop texture system and topping placement
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 6.3 Create drink creation interface (Phase 2)
    - Build ingredient selection UI with validation feedback
    - Implement real-time 3D preview updates
    - Add font selection for drink names with aesthetic rendering
    - Create 512×512 image generation for Reddit posts
    - _Requirements: 7.7, 7.8, 11.2, 11.3_

  - [x] 6.4 Implement default featured drinks display
    - Create 3 default drinks: girly, spooky Halloween, cyberpunk neon
    - Display drinks behind bartender in zoomed-out bar view
    - Implement recipe viewing and recreation functionality
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 6.5 Build custom component creation system (Phase 3)
    - Create component design interface unlocked after 3 drinks
    - Implement design tools for glasses, backdrops, flavors, toppings
    - Add component preview and submission to Reddit workflow
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 7. Implement animation and interaction systems
  - [ ] 7.1 Create pour and mixing animations
    - Implement realistic liquid filling animations with physics
    - Add satisfying "kerplunk" animations for ingredient drops
    - Create smooth zoom transitions between bar and mixing views
    - _Requirements: 11.5_

  - [ ] 7.2 Add UI feedback and validation animations
    - Implement button press and hover effects
    - Create validation error feedback with smooth transitions
    - Add loading states for Reddit post creation
    - _Requirements: 11.4, 11.5_

- [ ] 8. Create demo workflow and documentation
  - [ ] 8.1 Generate comprehensive demo script
    - Create docs/demo.md with ≤3-minute workflow demonstration
    - Document spec editing → type regeneration → validation flow
    - Show drink creation → Reddit submission → voting → promotion cycle
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 8.2 Update project documentation
    - Add "How specs → hooks → codegen works" section to README
    - Create workflow diagrams showing the development process
    - Document the three-phase game progression system
    - _Requirements: 14.5_

- [ ] 9. Integration testing and final polish
  - [ ] 9.1 Test complete workflow integration
    - Verify monorepo build and CI pipeline functionality
    - Test spec changes trigger proper code regeneration
    - Validate drink creation → Reddit → voting → promotion flow
    - Test custom component creation and approval process
    - _Requirements: 1.4, 4.2, 6.3, 6.4_

  - [ ] 9.2 Performance optimization and error handling
    - Optimize Three.js rendering with model caching and LOD
    - Implement Redis connection pooling and error recovery
    - Add comprehensive error handling for Reddit API failures
    - _Requirements: 5.4, 7.1, 7.2_

# Requirements Document

## Introduction

Bitpixi's Bar is a Reddit-integrated, cozy drink-making game where players create blended or layered drinks, customize backdrops, name their creations with aesthetic fonts, and share them with the Reddit community for voting. After creating 3 drinks, players unlock the ability to design custom components that get added to the system pool for all players. The game features a complete workflow from drink creation to community-driven featured menu curation, all built using Kiro's spec-driven development approach with automated code generation, hooks, and comprehensive testing.

## Requirements

### Requirement 1: Monorepo Project Structure

**User Story:** As a developer, I want a well-organized pnpm monorepo structure, so that I can maintain clean separation between client, server, shared logic, and generated code.

#### Acceptance Criteria

1. WHEN the project is initialized THEN the system SHALL create a pnpm monorepo with apps/client/, apps/devvit/, packages/logic/, packages/redis/, packages/types/, and .kiro/ directories
2. WHEN code is generated THEN the system SHALL place generated types only in packages/types/src/gen/* and generated logic only in packages/logic/src/gen/*
3. WHEN the project is built THEN the system SHALL include ESLint, Prettier, Vitest, and GitHub Actions for typecheck and tests
4. WHEN pnpm i && pnpm -w test && pnpm -w build is run THEN the system SHALL pass all CI checks

### Requirement 2: Spec-Driven Type Generation

**User Story:** As a developer, I want YAML specs to automatically generate TypeScript types and validators, so that I can maintain type safety and validation consistency across the application.

#### Acceptance Criteria

1. WHEN drink.yaml spec is defined THEN the system SHALL generate JSON Schemas and TypeScript types to packages/types/src/gen
2. WHEN shop.yaml spec is defined THEN the system SHALL generate runtime validators to packages/logic/src/gen/validators.ts
3. WHEN specs change THEN the system SHALL automatically regenerate all dependent code through hooks
4. WHEN validation is performed THEN the system SHALL enforce glass types, backdrop options, base ingredients, flavor/topping limits, mix modes, and color formats

### Requirement 3: Drink Creation and Validation

**User Story:** As a player, I want to create custom drinks with various ingredients and styles, so that I can express creativity while following game rules.

#### Acceptance Criteria

1. WHEN creating a drink THEN the system SHALL allow selection from 5 glass types (tall, short, mug, potion, martini)
2. WHEN creating a drink THEN the system SHALL allow selection from 4 backdrops (counter, neon, pumpkin_night, snow_window)
3. WHEN creating a drink THEN the system SHALL allow selection from 5 base ingredients (coffee, tea, milk, juice, soda)
4. WHEN adding flavors THEN the system SHALL limit to maximum 3 flavors
5. WHEN adding toppings THEN the system SHALL limit to maximum 3 toppings
6. WHEN choosing blend mode THEN the system SHALL require a valid hex color
7. WHEN choosing layered mode THEN the system SHALL require layers with colors and percentages totaling 100%
8. WHEN choosing layered mode THEN the system SHALL limit to maximum 4 layers
9. WHEN naming a drink THEN the system SHALL limit to 24 characters and block banned words (alcohol, beer, wine)
10. WHEN naming a drink THEN the system SHALL provide multiple aesthetic font options for girly, elegant styling

### Requirement 4: Automated Code Generation Hooks

**User Story:** As a developer, I want automated hooks to generate code, run validations, and maintain documentation, so that the development workflow is efficient and error-free.

#### Acceptance Criteria

1. WHEN drink validation is triggered THEN the system SHALL validate drink composition rules through validate-drink.ts hook
2. WHEN specs are updated THEN the system SHALL regenerate types and schemas through gen-types.ts hook
3. WHEN logic generation is triggered THEN the system SHALL emit pure helper functions through gen-logic.ts hook
4. WHEN test generation is triggered THEN the system SHALL create comprehensive Vitest suites through gen-tests.ts hook
5. WHEN documentation is updated THEN the system SHALL append changes to CHANGELOG.md and update README.md through gen-readme.ts hook

### Requirement 5: Redis Data Persistence

**User Story:** As a system, I want reliable data storage for drinks, votes, and leaderboards, so that player progress and community interactions are preserved.

#### Acceptance Criteria

1. WHEN a drink is saved THEN the system SHALL store it in Redis with keys drink:{id} for metadata and drink:{id}:json for recipe
2. WHEN a vote is cast THEN the system SHALL store it in drink:votes:{id} hash with uid -> vote direction
3. WHEN featured drinks are queried THEN the system SHALL use drinks:featured ZSET ordered by score
4. WHEN voting occurs THEN the system SHALL use atomic Lua scripts for idempotent vote processing
5. WHEN rate limiting is needed THEN the system SHALL implement sliding window rate limits using ZSET per action and user

### Requirement 6: Reddit Integration via Devvit

**User Story:** As a player, I want to share my drinks on Reddit and participate in community voting, so that I can engage with other players and see popular creations.

#### Acceptance Criteria

1. WHEN submitting a drink THEN the system SHALL create a SubmitDrinkPost with form validation and Reddit post creation
2. WHEN viewing drinks THEN the system SHALL display a VoteFeedPost with thumbnails and voting buttons
3. WHEN voting on drinks THEN the system SHALL update scores and automatically promote drinks with score ≥ 25 to FEATURED
4. WHEN viewing featured content THEN the system SHALL display a FeaturedMenuPost with top drinks and recipe copying
5. WHEN drinks receive score ≤ -5 THEN the system SHALL automatically retire them

### Requirement 7: Three.js Visual Client

**User Story:** As a player, I want an engaging 3D interface to create and preview drinks, so that the drink-making experience is visually appealing and intuitive.

#### Acceptance Criteria

1. WHEN the client loads THEN the system SHALL display a side panel for drink customization and a 3D canvas for preview
2. WHEN selecting ingredients THEN the system SHALL render the appropriate glass model with fill visualization
3. WHEN choosing blend mode THEN the system SHALL render a single colored cylinder fill
4. WHEN choosing layered mode THEN the system SHALL render multiple stacked cylinders with different colors
5. WHEN selecting backdrops THEN the system SHALL display textured planes from /backdrops/{backdrop}.jpg
6. WHEN adding toppings THEN the system SHALL place sprites/meshes at the glass rim
7. WHEN previewing THEN the system SHALL render 512×512 image to dataURL for sharing
8. WHEN posting THEN the system SHALL call Devvit submit endpoint with drink JSON and image URL

### Requirement 8: Deterministic Game Logic

**User Story:** As a developer, I want deterministic and testable game logic, so that behavior is predictable and thoroughly tested.

#### Acceptance Criteria

1. WHEN blending colors THEN the system SHALL use linear-RGB averaging with optional seed parameter
2. WHEN formatting drink summaries THEN the system SHALL generate consistent text descriptions
3. WHEN validating drinks THEN the system SHALL return structured error messages
4. WHEN testing with seeds THEN the system SHALL produce identical results for identical inputs
5. WHEN running tests THEN the system SHALL achieve ≥ 85% coverage on packages/logic

### Requirement 9: Community Voting and Promotion System

**User Story:** As a community member, I want to vote on drinks and see popular creations featured, so that the best content rises to the top.

#### Acceptance Criteria

1. WHEN casting votes THEN the system SHALL allow thumbs up (+1) or thumbs down (-1) voting
2. WHEN drinks reach 25 points THEN the system SHALL automatically promote them to FEATURED status
3. WHEN drinks reach -5 points THEN the system SHALL automatically retire them
4. WHEN viewing featured menu THEN the system SHALL display drinks ordered by score
5. WHEN copying recipes THEN the system SHALL provide JSON to clipboard functionality

### Requirement 10: Custom Component Creation System

**User Story:** As a player, I want to design custom drink components and backdrops after making 1 drink, so that I can quickly contribute to the game's content and see my creations used by other players.

#### Acceptance Criteria

1. WHEN a player has created 1 drink THEN the system SHALL unlock custom component design features
2. WHEN designing custom components THEN the system SHALL allow creation of new glass types, backdrops, flavors, and toppings
3. WHEN submitting custom components THEN the system SHALL add them to the system pool for all players after community approval
4. WHEN custom components are approved THEN the system SHALL credit the original creator
5. WHEN using custom components THEN the system SHALL maintain the same validation rules as default components

### Requirement 11: Aesthetic Design and Fonts

**User Story:** As a player, I want beautiful, versatile aesthetic design with multiple font options, so that my drink creations can match different themes and personal styles.

#### Acceptance Criteria

1. WHEN designing the UI THEN the system SHALL use a cozy, welcoming aesthetic that supports multiple themes (girly, spooky, cyberpunk)
2. WHEN naming drinks THEN the system SHALL provide at least 5 different font options (script, serif, sans-serif, decorative, handwritten)
3. WHEN displaying drinks THEN the system SHALL render names with the selected font in an aesthetically pleasing way
4. WHEN viewing the game THEN the system SHALL maintain consistent theming that adapts to drink styles
5. WHEN transitioning between views THEN the system SHALL use smooth, elegant animations

### Requirement 13: Default Featured Drinks

**User Story:** As a new player, I want to see example drinks that showcase different aesthetic styles, so that I understand the range of possibilities and get inspired.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL display 3 default featured drinks behind the bartender
2. WHEN viewing default drinks THEN the system SHALL show one girly-themed drink with elegant styling
3. WHEN viewing default drinks THEN the system SHALL show one spooky Halloween-themed drink with dark aesthetics
4. WHEN viewing default drinks THEN the system SHALL show one cyberpunk neon-themed drink with bright, futuristic styling
5. WHEN interacting with default drinks THEN the system SHALL allow players to view recipes and try recreating them

### Requirement 14: Development and Demo Workflow

**User Story:** As a developer showcasing Kiro capabilities, I want a clear demonstration of the spec-driven workflow, so that the development process is transparent and reproducible.

#### Acceptance Criteria

1. WHEN running the demo THEN the system SHALL complete the workflow in ≤ 3 minutes
2. WHEN editing specs THEN the system SHALL show automatic regeneration of types and validators
3. WHEN creating drinks THEN the system SHALL demonstrate validation and submission flow
4. WHEN voting occurs THEN the system SHALL show automatic promotion to featured status
5. WHEN documentation is generated THEN the system SHALL include "How specs → hooks → codegen works" section with diagrams

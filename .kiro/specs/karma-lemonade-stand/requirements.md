# Requirements Document

## Introduction

The Karma Lemonade Stand is a Reddit-integrated business simulation game where players run a virtual lemonade stand. The game uses players' Reddit karma, account age, and other stats to influence their business performance. Players make daily decisions about pricing and advertising while dealing with dynamic weather conditions, market events, and seasonal festivals. The game features daily and weekly leaderboards, login bonuses, and deterministic scoring based on Reddit profile data.

## Requirements

### Requirement 1

**User Story:** As a Reddit user, I want to start a lemonade stand business simulation that uses my Reddit karma and account stats to determine my business capabilities, so that my Reddit activity directly impacts my gameplay performance.

#### Acceptance Criteria

1. WHEN a user starts the game THEN the system SHALL retrieve their Reddit karma (post and comment), account age, and awards
2. WHEN calculating business stats THEN the system SHALL convert comment karma to service level using a configurable ratio
3. WHEN calculating business stats THEN the system SHALL convert post karma to marketing level using a configurable ratio
4. WHEN calculating business stats THEN the system SHALL convert account age to reputation level using a configurable ratio
5. WHEN a user has higher service levels THEN the system SHALL increase their customer satisfaction and sales
6. WHEN a user has higher marketing levels THEN the system SHALL provide demand bonuses
7. WHEN a user has higher reputation THEN the system SHALL provide trust-based demand increases

### Requirement 2

**User Story:** As a player, I want to make daily business decisions about pricing and advertising spend within configured limits, so that I can optimize my lemonade stand's profitability.

#### Acceptance Criteria

1. WHEN a player starts a daily run THEN the system SHALL present pricing options between configured min and max price limits
2. WHEN a player starts a daily run THEN the system SHALL present advertising spend options between configured min and max ad spend limits
3. WHEN a player selects pricing THEN the system SHALL apply price elasticity effects to demand calculation
4. WHEN a player selects advertising spend THEN the system SHALL apply advertising effectiveness to demand calculation
5. WHEN calculating profit THEN the system SHALL deduct inventory costs, fixed daily costs, and advertising spend from revenue
6. WHEN a player completes a run THEN the system SHALL display profit, cups sold, and contributing factors

### Requirement 3

**User Story:** As a player, I want to experience dynamic daily conditions including weather and market events that affect my business performance, so that each day presents unique challenges and opportunities.

#### Acceptance Criteria

1. WHEN a new day begins THEN the system SHALL generate deterministic weather conditions using a daily seed
2. WHEN weather is generated THEN the system SHALL apply weather-specific demand multipliers (HOT increases demand, RAIN decreases demand)
3. WHEN a new day begins THEN the system SHALL generate market events (VIRAL, SUGAR_SHORT, INFLATION, NONE) with configured probabilities
4. WHEN market events occur THEN the system SHALL apply event-specific demand and cost multipliers
5. WHEN calculating daily prices THEN the system SHALL generate lemon and sugar prices using normal distribution with daily seed
6. WHEN all daily conditions are set THEN the system SHALL store them in a daily cycle configuration accessible to all players

### Requirement 4

**User Story:** As a player, I want to participate in weekly festivals that provide special gameplay modifiers and themed experiences, so that I have longer-term goals and variety in gameplay.

#### Acceptance Criteria

1. WHEN a new week begins THEN the system SHALL generate a festival theme from 30+ available themes including holidays, aesthetics, eras, and genres using weekly seed
2. WHEN holiday themes are active (VALENTINE_HEARTS, EASTER_SPRING, HALLOWEEN_SPOOKY, CHRISTMAS_WINTER, etc.) THEN the system SHALL apply themed demand multipliers and special effects
3. WHEN aesthetic themes are active (NEON_CYBER, VINTAGE_RETRO, MINIMALIST_CLEAN, COTTAGECORE_COZY, etc.) THEN the system SHALL apply visual style modifiers and gameplay bonuses
4. WHEN era themes are active (MEDIEVAL_TIMES, WILD_WEST, SPACE_AGE, STONE_AGE, etc.) THEN the system SHALL apply period-appropriate gameplay mechanics and multipliers
5. WHEN genre themes are active (ZOMBIE_APOCALYPSE, SUPERHERO_CITY, PIRATE_SEAS, NINJA_VILLAGE, etc.) THEN the system SHALL apply genre-specific special events and bonuses
6. WHEN festival modifiers are active THEN the system SHALL apply them in addition to daily weather and event effects
7. WHEN a festival week ends THEN the system SHALL reset weekly leaderboards and generate new festival for next week

### Requirement 5

**User Story:** As a player, I want to experience diverse weekly festival themes with unique visual styles and gameplay modifiers, so that each week feels fresh and provides new strategic opportunities.

#### Acceptance Criteria

1. WHEN the system generates weekly festivals THEN it SHALL select from holiday themes: VALENTINE_HEARTS, EASTER_SPRING, MOTHER_DAY_GARDEN, FATHER_DAY_GRILL, SUMMER_SOLSTICE, HALLOWEEN_SPOOKY, WINTER_SOLSTICE, CHRISTMAS_WINTER, NEW_YEAR_PARTY, ST_PATRICK_LUCKY
2. WHEN the system generates weekly festivals THEN it SHALL select from aesthetic themes: NEON_CYBER, VINTAGE_RETRO, MINIMALIST_CLEAN, COTTAGECORE_COZY, DARK_GOTHIC, PASTEL_KAWAII, GRUNGE_PUNK, ART_DECO_GLAM, TROPICAL_PARADISE, DESERT_OASIS
3. WHEN the system generates weekly festivals THEN it SHALL select from era themes: MEDIEVAL_TIMES, WILD_WEST, SPACE_AGE, STONE_AGE, ROARING_TWENTIES, DISCO_SEVENTIES, NEON_EIGHTIES, GRUNGE_NINETIES, VICTORIAN_ELEGANCE, ANCIENT_EGYPT
4. WHEN the system generates weekly festivals THEN it SHALL select from genre themes: ZOMBIE_APOCALYPSE, SUPERHERO_CITY, PIRATE_SEAS, NINJA_VILLAGE, WIZARD_ACADEMY, ROBOT_FACTORY, FAIRY_FOREST, DETECTIVE_NOIR, RACING_SPEEDWAY, MUSIC_FESTIVAL
5. WHEN festival themes are active THEN each SHALL provide unique gameplay modifiers, visual elements, and special mechanics appropriate to the theme
6. WHEN players view the game during festivals THEN they SHALL see themed UI elements, backgrounds, and stand decorations matching the active festival

### Requirement 6

**User Story:** As a player, I want to receive daily login bonuses that provide temporary advantages, so that I'm incentivized to play regularly and have varied gameplay experiences.

#### Acceptance Criteria

1. WHEN a player logs in for their first play of a UTC day THEN the system SHALL determine their login bonus using daily seed
2. WHEN PERFECT bonus is awarded THEN the system SHALL apply 1.15x revenue multiplier for that day's runs
3. WHEN FREE_AD bonus is awarded THEN the system SHALL provide 2 additional advertising credit for that day
4. WHEN COOLER bonus is awarded THEN the system SHALL ignore COLD weather penalties for that day
5. WHEN NONE bonus is selected THEN the system SHALL provide no additional benefits
6. WHEN login bonuses are applied THEN the system SHALL store them in user profile for 24-hour duration

### Requirement 7

**User Story:** As a competitive player, I want to see daily and weekly leaderboards showing top performers, so that I can compare my performance with other players and strive for better rankings.

#### Acceptance Criteria

1. WHEN a player completes a profitable run THEN the system SHALL update the daily leaderboard with their score
2. WHEN a player completes a profitable run THEN the system SHALL update the weekly leaderboard with their score
3. WHEN displaying leaderboards THEN the system SHALL show top performers with usernames and scores
4. WHEN a new day begins THEN the system SHALL reset the daily leaderboard
5. WHEN a new week begins THEN the system SHALL reset the weekly leaderboard
6. WHEN leaderboards are updated THEN the system SHALL maintain only top 50 entries for performance

### Requirement 8

**User Story:** As a player, I want the game to enforce fair play limits and prevent abuse, so that all players have equal opportunities and the game remains balanced.

#### Acceptance Criteria

1. WHEN a player attempts multiple runs THEN the system SHALL enforce maximum posts per user per day limit
2. WHEN a player attempts consecutive runs THEN the system SHALL enforce minimum seconds between runs
3. WHEN calculating scores THEN the system SHALL use deterministic algorithms based on user ID and run count to prevent manipulation
4. WHEN a player exceeds rate limits THEN the system SHALL display appropriate error messages and prevent further attempts
5. WHEN validating runs THEN the system SHALL verify all calculations server-side to prevent client-side tampering

### Requirement 9

**User Story:** As a player, I want my game results automatically posted to Reddit with visual result cards, so that I can share my achievements and attract other players to the game.

#### Acceptance Criteria

1. WHEN a player completes a run THEN the system SHALL generate a result card image showing profit, weather, and key stats
2. WHEN posting results THEN the system SHALL create a Reddit post with formatted title including day number, username, profit, and weather
3. WHEN posting results THEN the system SHALL include action buttons for "Start Your Stand" and "View Leaderboard"
4. WHEN posting results THEN the system SHALL include verification information with partial seed and "Verified by Kiro" footer
5. WHEN generating posts THEN the system SHALL ensure all visual elements are mobile-friendly and engaging

### Requirement 10

**User Story:** As a player, I want to track my personal progress including streaks and best scores, so that I can see my improvement over time and maintain engagement.

#### Acceptance Criteria

1. WHEN a player completes daily runs THEN the system SHALL track consecutive day streaks
2. WHEN a player achieves new personal bests THEN the system SHALL update and store their best profit scores
3. WHEN a player views their profile THEN the system SHALL display current streak, best scores, and total runs
4. WHEN a player misses a day THEN the system SHALL reset their streak counter
5. WHEN calculating streaks THEN the system SHALL use UTC day boundaries for consistency across time zones

### Requirement 11

**User Story:** As a player with low Reddit stats or recent losses, I want to purchase temporary power-ups that give me a fair boost without guaranteeing wins, so that I can compete more effectively while supporting the game's development.

#### Acceptance Criteria

1. WHEN a player has marketing=0 AND service=0 AND reputation=0 THEN the system SHALL offer Super Sugar power-up purchase option
2. WHEN a player has had 2 consecutive losses THEN the system SHALL offer Super Sugar power-up purchase option
3. WHEN a player purchases Super Sugar THEN the system SHALL apply +20% demand bonus and +1 service tier for that run
4. WHEN a player attempts to purchase Super Sugar THEN the system SHALL enforce daily limit of 2 purchases per user
5. WHEN processing power-up purchases THEN the system SHALL verify payment receipts server-side using Devvit Payments
6. WHEN a power-up is used THEN the system SHALL mark the run with power-up indicators on leaderboards and posts
7. WHEN displaying leaderboards THEN the system SHALL provide separate "Pure League" rankings for runs without power-ups

### Requirement 12

**User Story:** As a system administrator, I want configurable game parameters, payment settings, and automated daily/weekly cycles, so that the game can be balanced and maintained without manual intervention.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL load global configuration including economy parameters, stat scaling, payment settings, and feature flags
2. WHEN daily reset occurs at 00:05 UTC THEN the system SHALL generate new weather, prices, events, reset daily leaderboard, and reset daily power-up usage counters
3. WHEN weekly reset occurs on Sunday 23:55 UTC THEN the system SHALL generate new festival and reset weekly leaderboard
4. WHEN configuration changes are needed THEN administrators SHALL be able to update global config including power-up pricing and limits without code deployment
5. WHEN system monitoring is needed THEN the system SHALL track daily run counters, payment transactions, and alert on anomalies
6. WHEN payment receipts are processed THEN the system SHALL store receipt verification data and prevent duplicate consumption

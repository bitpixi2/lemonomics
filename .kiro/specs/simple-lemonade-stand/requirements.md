# Requirements Document

## Introduction

Lemonomics is a classic business simulation game built as a Reddit Devvit app. Players run a virtual lemonade stand by making daily decisions about pricing and purchasing ingredients. The game features simple weather effects and basic profit calculations, providing an engaging but straightforward gameplay experience.

## Glossary

- **Lemonade_Stand_System**: The core game application that manages gameplay, calculations, and user interactions
- **Player**: A Reddit user who plays the lemonade stand game
- **Game_Day**: A single gameplay session where the player makes business decisions
- **Weather_Condition**: Daily weather that affects customer demand (Sunny, Cloudy, Rainy)
- **Profit**: Revenue minus costs for a single game day

## Requirements

### Requirement 1

**User Story:** As a Reddit user, I want to start a simple lemonade stand game that I can play directly in a Reddit post, so that I can enjoy a quick business simulation game.

#### Acceptance Criteria

1. WHEN a player opens the game, THE Lemonade_Stand_System SHALL display a welcome screen with a "Start Game" button
2. WHEN a player clicks "Start Game", THE Lemonade_Stand_System SHALL initialize a new game session
3. WHEN the game starts, THE Lemonade_Stand_System SHALL display the current day number starting from Day 1
4. THE Lemonade_Stand_System SHALL run within a Reddit post as a Devvit web app
5. THE Lemonade_Stand_System SHALL be mobile-friendly and responsive

### Requirement 2

**User Story:** As a player, I want to make daily business decisions about ingredient purchases and pricing, so that I can try to maximize my lemonade stand's profit.

#### Acceptance Criteria

1. WHEN starting a Game_Day, THE Lemonade_Stand_System SHALL display current cash amount
2. WHEN making purchases, THE Lemonade_Stand_System SHALL allow players to buy lemons (cost: $0.05 each)
3. WHEN making purchases, THE Lemonade_Stand_System SHALL allow players to buy sugar (cost: $0.02 per cup)
4. WHEN making purchases, THE Lemonade_Stand_System SHALL allow players to buy cups (cost: $0.01 each)
5. WHEN setting price, THE Lemonade_Stand_System SHALL allow players to set lemonade price between $0.05 and $1.00
6. THE Lemonade_Stand_System SHALL prevent purchases that exceed available cash

### Requirement 3

**User Story:** As a player, I want to experience different weather conditions that affect my business, so that each day presents unique challenges.

#### Acceptance Criteria

1. WHEN a new Game_Day begins, THE Lemonade_Stand_System SHALL randomly generate a Weather_Condition
2. WHEN Weather_Condition is Sunny, THE Lemonade_Stand_System SHALL apply 1.5x demand multiplier
3. WHEN Weather_Condition is Cloudy, THE Lemonade_Stand_System SHALL apply 1.0x demand multiplier
4. WHEN Weather_Condition is Rainy, THE Lemonade_Stand_System SHALL apply 0.5x demand multiplier
5. THE Lemonade_Stand_System SHALL display the current Weather_Condition to the player

### Requirement 4

**User Story:** As a player, I want to see my daily results including profit and cups sold, so that I can understand how my decisions affected my business performance.

#### Acceptance Criteria

1. WHEN the Game_Day ends, THE Lemonade_Stand_System SHALL calculate total cups sold based on demand
2. WHEN calculating demand, THE Lemonade_Stand_System SHALL use base demand of 50 customers modified by weather and price
3. WHEN price is higher, THE Lemonade_Stand_System SHALL reduce demand (price elasticity)
4. WHEN calculating Profit, THE Lemonade_Stand_System SHALL subtract ingredient costs from revenue
5. THE Lemonade_Stand_System SHALL display daily results showing cups sold, revenue, costs, and Profit
6. THE Lemonade_Stand_System SHALL update total cash with the day's Profit

### Requirement 5

**User Story:** As a player, I want to continue playing multiple days to build up my business, so that I can see my progress over time.

#### Acceptance Criteria

1. WHEN a Game_Day ends, THE Lemonade_Stand_System SHALL offer a "Next Day" button
2. WHEN "Next Day" is clicked, THE Lemonade_Stand_System SHALL increment the day counter
3. WHEN starting a new day, THE Lemonade_Stand_System SHALL carry forward the player's cash balance
4. THE Lemonade_Stand_System SHALL track total days played in the current session
5. WHEN cash reaches $0 or below, THE Lemonade_Stand_System SHALL end the game and show final results

### Requirement 6

**User Story:** As a player, I want to see my final game summary when the game ends, so that I can evaluate my overall performance.

#### Acceptance Criteria

1. WHEN the game ends, THE Lemonade_Stand_System SHALL display total days survived
2. WHEN the game ends, THE Lemonade_Stand_System SHALL display highest single-day Profit achieved
3. WHEN the game ends, THE Lemonade_Stand_System SHALL display total cups sold across all days
4. THE Lemonade_Stand_System SHALL offer a "Play Again" button to restart the game
5. WHEN "Play Again" is clicked, THE Lemonade_Stand_System SHALL reset all game state to initial values

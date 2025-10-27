# Lemonomics Game Engine

This directory contains the core game logic for the Lemonomics lemonade stand game.

## Components

### GameSessionManager (`GameSession.ts`)
Manages individual game sessions with the following features:
- **Session Creation**: Creates new game sessions with starting cash ($10) and free sugar (2 cups)
- **Inventory Management**: Tracks lemons, sugar, and cups with validation
- **Ingredient Purchasing**: Validates and processes ingredient purchases with cost calculation
- **Session Lifecycle**: Handles session updates, day progression, and cleanup

**Key Methods:**
- `createSession(userId)` - Start a new game
- `purchaseIngredients(sessionId, purchase)` - Buy ingredients
- `validateIngredientPurchase(session, purchase)` - Check if purchase is valid
- `canMakeLemonade(sessionId, cupsToMake)` - Check ingredient availability

### SalesCalculator (`SalesCalculator.ts`)
Calculates daily sales results based on multiple factors:
- **Demand Calculation**: Weather, karma boost, price elasticity, and festival effects
- **Sales Simulation**: Determines cups sold based on supply vs demand
- **Profit Calculation**: Revenue minus ingredient costs
- **Customer Feedback**: Dynamic dialogue based on performance

**Key Features:**
- Weather multipliers: Sunny (1.5x), Cloudy (1.0x), Rainy (0.6x)
- Price elasticity: Optimal range $0.50-$0.75
- Karma boost effects: Bronze (1.1x), Silver (1.2x), Gold (1.3x)
- Festival multipliers for special events

### LemonadeGameEngine (`GameEngine.ts`)
Main game engine that orchestrates all game logic:
- **Game Flow**: Manages complete game sessions from start to finish
- **Day Simulation**: Processes ingredient purchases and daily sales
- **Weather Generation**: Random weather with weighted probabilities
- **Leaderboard**: Mock leaderboard system (ready for database integration)

**Key Methods:**
- `startNewGame(userId)` - Initialize new game session
- `playDay(sessionId, dayInput, weather?, festival?, karmaBoost?)` - Process a single day
- `simulateDay(sessionId, ingredients, price, weather?)` - Complete day simulation
- `endGame(sessionId)` - Finalize game and calculate results

## Game Mechanics

### Ingredient Costs
- Lemons: $0.50 each
- Sugar: $0.25 per cup
- Cups: $0.10 each

### Recipe
Each cup of lemonade requires:
- 1 lemon
- 1 cup of sugar  
- 1 cup

### Demand Factors
1. **Base Demand**: 15-25 customers (increases with day progression)
2. **Weather**: Sunny days boost demand, rainy days reduce it
3. **Price**: Higher prices reduce demand (price elasticity)
4. **Karma**: Higher Reddit karma attracts more customers
5. **Festivals**: Special events can boost demand

### Performance Categories
- **Good**: Sold 80%+ of demand - positive customer feedback
- **Average**: Sold 50-79% of demand - neutral feedback  
- **Poor**: Sold <50% of demand - negative feedback

## Usage Example

```typescript
import { LemonadeGameEngine } from './GameEngine.js';

const engine = new LemonadeGameEngine();

// Start new game
const session = await engine.startNewGame('user123');

// Purchase ingredients
const purchase = engine.purchaseIngredients(session.sessionId, {
  lemons: 10, sugar: 5, cups: 15
});

// Play a day
const dayResult = await engine.playDay(session.sessionId, {
  lemons: 8, sugar: 8, cups: 8, pricePerCup: 0.75
});

// End game
const finalResult = await engine.endGame(session.sessionId);
```

## Integration Notes

- The game engine is framework-agnostic and can be used in both client and server contexts
- All calculations are deterministic given the same inputs (except for random weather/dialogue)
- Session management includes automatic cleanup for memory efficiency
- Ready for Redis integration for persistent storage
- Mock leaderboard system can be easily replaced with database queries

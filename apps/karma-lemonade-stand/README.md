# Karma Lemonade Stand

A Reddit-integrated business simulation game where players run a virtual lemonade stand using their Reddit karma and account stats as business capabilities.

## Features

- **Reddit Integration**: Uses karma, account age, and awards to determine business stats
- **Dynamic Gameplay**: Weather conditions, market events, and seasonal festivals
- **Competitive Elements**: Daily and weekly leaderboards
- **Payment System**: Optional power-ups for struggling players
- **Mobile-First Design**: Optimized for Reddit's mobile audience

## Development

### Prerequisites

- Node.js 22.2.0 or higher
- pnpm package manager
- Devvit CLI

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Deploy to Reddit
pnpm run deploy
```

### Project Structure

```
src/
├── client/     # Frontend game interface
├── server/     # Backend API and Reddit integration
└── shared/     # Shared types and utilities
```

### Configuration

The game uses a global configuration system stored in Redis:

- Economy parameters (pricing, costs, multipliers)
- Stat scaling ratios
- Rate limiting settings
- Payment configuration
- Festival definitions

### API Endpoints

- `GET /api/health` - Server health check
- `GET /api/config` - Game configuration
- `POST /api/scoreRun` - Submit game run (coming soon)
- `GET /api/profile` - User profile data (coming soon)
- `GET /api/leaderboards` - Leaderboard data (coming soon)

## Game Mechanics

### Business Stats

Reddit stats are converted to business capabilities:
- **Comment Karma** → Service Level (customer satisfaction)
- **Post Karma** → Marketing Level (demand bonuses)
- **Account Age** → Reputation Level (trust-based demand)

### Daily Cycles

Each day features:
- Deterministic weather conditions
- Market events (viral trends, supply shortages, inflation)
- Dynamic ingredient pricing
- Login bonuses

### Weekly Festivals

30+ themed festivals with unique modifiers:
- Holiday themes (Christmas, Halloween, etc.)
- Aesthetic themes (Neon Cyber, Vintage Retro, etc.)
- Era themes (Medieval, Wild West, Space Age, etc.)
- Genre themes (Zombie Apocalypse, Superhero City, etc.)

## Deployment

The app is configured for deployment on Reddit's Devvit platform with:
- Reddit API permissions for user data
- Redis for data persistence
- Payments API for power-up purchases

## License

BSD-3-Clause

# 🍋 Lemonomics Game - Technical Documentation 🍋

```
                    🍋 LEMONOMICS 🍋
                  ╔══════════════════╗
                  ║   GAME ENGINE    ║
                  ║  🏪 TECHNICAL 🏪 ║
                  ║   DOCUMENTATION  ║
                  ╚══════════════════╝
                         🍋⚙️🍋
```

## 🎮 Game Overview

**Lemonomics** is a Reddit-integrated business simulation game where players run virtual lemonade stands. The game transforms Reddit user statistics (karma, account age, awards) into business capabilities, creating a unique gaming experience that rewards Reddit community participation.

## 📚 About & History

This modern Reddit game is inspired by the classic **Lemonade Stand** game originally created by **Bob Jamison** for mainframe computers in **1973**. The concept was later adapted and modified by **Charlie Kellner** for the Apple II computer in **1979**, becoming one of the most beloved early computer games.

🔗 **Historical Reference**: You can view the original Apple BASIC source code [here](https://gist.github.com/badvision/16b74ade3a8b2fa2e87d)

**Lemonomics** honors this gaming legacy while bringing the lemonade stand experience into the modern era with:
- Reddit community integration
- Real-time multiplayer competition  
- Advanced game mechanics and festivals
- Social features and leaderboards
- Mobile-optimized gameplay

From 1973 mainframes to 2025 Reddit - the entrepreneurial spirit of running a lemonade stand continues! 🍋

```
🎯 CORE GAMEPLAY LOOP
┌─────────────────────────────────────┐
│ 1. 📊 Reddit Stats → Business Stats │
│ 2. 🎲 Daily Conditions Generated    │
│ 3. 🎯 Player Makes Decisions        │
│ 4. 💰 Profit Calculated             │
│ 5. 🏆 Leaderboards Updated          │
│ 6. 📱 Results Posted to Reddit      │
└─────────────────────────────────────┘
```

## 🏗️ Architecture

### 📁 Project Structure
```
src/
├── 🎨 client/              # React frontend
│   ├── components/         # Game UI components
│   ├── styles/            # CSS styling
│   └── main.tsx           # Client entry point
├── ⚙️ server/              # Express.js backend
│   ├── api/               # REST API endpoints
│   ├── engine/            # Game logic core
│   ├── services/          # Business services
│   ├── payments/          # Payment processing
│   ├── cycles/            # Daily/weekly cycles
│   ├── bonuses/           # Login bonus system
│   ├── progress/          # Progress tracking
│   ├── security/          # Anti-cheat & validation
│   └── monitoring/        # Analytics & health
├── 🔗 shared/             # Shared types & utilities
│   ├── types/             # TypeScript interfaces
│   └── redis/             # Redis adapters
└── 🧪 tests/              # Test suites
    ├── unit/              # Unit tests
    ├── integration/       # API tests
    └── e2e/               # End-to-end tests
```

### 🎯 Core Systems

#### 🎲 Game Engine
```typescript
// Deterministic scoring system
GameEngine → DemandCalculator → ProfitCalculator
     ↓              ↓                ↓
Reddit Stats → Customer Count → Final Profit
```

#### 🔄 Cycle Management
```
Daily Cycle (00:05 UTC)
├── 🌤️ Weather Generation
├── 📰 Market Events  
├── 🍋 Ingredient Prices
├── 🎁 Login Bonuses
└── 📊 Leaderboard Reset

Weekly Cycle (Sunday 23:55 UTC)  
├── 🎪 Festival Selection
├── 🎨 Theme Application
├── 📈 Weekly Leaderboard Reset
└── 🔄 Cycle Archive
```

#### 💳 Payment System
```
Power-up Purchase Flow:
User → Devvit Payments → Receipt Verification → Effect Application
                              ↓
                        Server Validation → Usage Tracking
```

## 🎮 Game Mechanics

### 📊 Reddit Stats Conversion
```typescript
// Your Reddit history becomes business power!
Comment Karma × 0.001 = Service Level      (Customer satisfaction)
Post Karma × 0.001    = Marketing Level    (Advertising effectiveness)  
Account Age × 0.01    = Reputation Level   (Customer trust)
Awards                = Special Bonuses    (Unique advantages)
```

### 🌤️ Dynamic Conditions
```
Weather Effects:
☀️ Sunny    → 1.2x demand
🔥 Hot      → 1.5x demand  
☁️ Cloudy   → 1.0x demand
🌧️ Rainy    → 0.6x demand
❄️ Cold     → 0.4x demand

Market Events:
🚀 Viral      → 2.0x demand
🍋 Sugar Short → 0.8x demand, higher costs
💸 Inflation  → 0.9x demand, higher costs  
📈 Normal     → 1.0x demand
```

### 🎪 Festival System (30+ Themes)
```
Holiday Festivals:
🎃 Halloween Spooky    → Spooky boost + critical sales
🎄 Christmas Winter   → 1.4x demand + gift giving
💝 Valentine Hearts   → 1.2x demand + love boost
🌸 Easter Spring      → 1.15x demand + spring bloom

Aesthetic Festivals:  
🌈 Neon Cyber        → Digital boost + neon glow
🏰 Cottagecore Cozy  → Homemade charm + countryside peace
🎨 Art Deco Glam     → Luxury appeal + golden age
🌴 Tropical Paradise → 1.3x demand + island vibes

Era Festivals:
🏰 Medieval Times    → Ye olde charm + medieval fair
🚀 Space Age        → Cosmic energy + space exploration  
🤠 Wild West        → Frontier spirit + gold rush
🏛️ Ancient Egypt     → Pharaoh blessing + pyramid power

Genre Festivals:
🧙‍♂️ Wizard Academy   → Magic boost + spell casting
🏴‍☠️ Pirate Seas      → Treasure hunt + sea adventure
🤖 Robot Factory    → Automation + mechanical precision
🧚‍♀️ Fairy Forest     → Fairy magic + enchanted grove
```

## 🛠️ Development

### 🚀 Quick Start
```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Type checking
npm run type-check

# Run all tests
npm run test

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # API tests only  
npm run test:e2e        # End-to-end tests only

# Build for production
npm run build

# Deploy to Reddit
npm run upload

# Publish for review
npm run launch
```

### 🧪 Testing Strategy
```
📊 Test Coverage:
├── ✅ 54 Unit Tests      (Core logic validation)
├── 🔗 38 Integration Tests (API endpoint testing)
├── 🎮 8 E2E Tests        (Complete user flows)
└── 📈 100% TypeScript    (Type safety guaranteed)

🎯 Test Categories:
├── 🎲 Game Engine Logic
├── 📊 Reddit Integration  
├── 💳 Payment Processing
├── 🔄 Cycle Management
├── 🏆 Leaderboard System
├── 🎁 Login Bonuses
├── 📈 Progress Tracking
└── 🔒 Security Validation
```

### 🔧 Configuration
```typescript
// Global game configuration
interface GameConfig {
  game: {
    minPrice: 0.25,        // Minimum lemonade price
    maxPrice: 5.0,         // Maximum lemonade price  
    minAdSpend: 0,         // Minimum advertising
    maxAdSpend: 50         // Maximum advertising
  },
  economy: {
    baseCustomers: 20,     // Base customer count
    priceElasticity: 0.8,  // Price sensitivity
    adEffect: 0.1,         // Advertising effectiveness
    inventoryCostPerCup: 0.15, // Cost per cup
    fixedCostPerDay: 5.0   // Daily overhead
  },
  limits: {
    maxPostsPerUserPerDay: 10,    // Rate limiting
    minSecondsBetweenRuns: 30     // Cooldown period
  }
}
```

## 🔒 Security & Fair Play

### 🛡️ Anti-Cheat Measures
```
Server-Side Validation:
├── 🎯 All calculations verified server-side
├── 🎲 Deterministic algorithms prevent manipulation
├── ⏱️ Rate limiting prevents spam
├── 🔍 Suspicious pattern detection
└── 📊 Statistical anomaly monitoring

Payment Security:
├── 💳 Receipt verification with Devvit
├── 🔒 Server-side payment validation
├── 🚫 Replay attack prevention  
├── 📊 Usage tracking and limits
└── 🔐 Secure signature validation
```

### 🎯 Fair Competition
```
Deterministic Systems:
├── 🎲 Seed-based randomization
├── 📊 Consistent scoring algorithms
├── 🏆 Transparent leaderboards
├── 💎 Power-up indicators
└── 🎮 Separate pure league rankings
```

## 📊 Data Models

### 👤 User Profile
```typescript
interface UserProfile {
  userId: string;
  username: string;
  redditStats: {
    postKarma: number;
    commentKarma: number; 
    accountAgeDays: number;
    awards: number;
  };
  gameStats: {
    service: number;      // Converted from comment karma
    marketing: number;    // Converted from post karma
    reputation: number;   // Converted from account age
  };
  progress: {
    totalRuns: number;
    currentStreak: number;
    longestStreak: number;
    bestProfit: number;
    lastPlayDate: string;
  };
}
```

### 🎮 Game Result
```typescript
interface GameResult {
  profit: number;           // Final profit earned
  cupsSold: number;        // Cups of lemonade sold
  weather: WeatherType;    // Daily weather condition
  event: MarketEvent;      // Market event that occurred
  festival: string;        // Active festival theme
  streak: number;          // Current player streak
  seed: string;           // Deterministic seed used
  powerupsApplied: string[]; // Power-ups used
}
```

## 🚀 Deployment

### 📦 Production Build
```bash
# Build optimized production bundle
npm run build

# Upload to Reddit's servers  
npm run upload

# Submit for review and publish
npm run launch
```

### 📊 Monitoring
```
Health Checks:
├── 🔍 /api/health        → Basic health status
├── 📊 /api/health/detailed → Detailed system info
├── ✅ /api/health/ready   → Readiness probe
├── 💓 /api/health/live    → Liveness probe
└── 📈 /api/health/metrics → Performance metrics

Analytics:
├── 🎮 Game session tracking
├── 💳 Payment transaction monitoring
├── 🏆 Leaderboard performance
├── 🔒 Security event logging
└── 📊 User engagement metrics
```

## 🎯 API Endpoints

### 🎮 Game Operations
```
POST /api/run-game        → Execute a game run
GET  /api/profile         → Get user profile & stats
GET  /api/leaderboards    → Get leaderboard rankings
GET  /api/current-cycle   → Get daily/weekly conditions
```

### 💳 Payment Operations  
```
POST /api/purchase        → Purchase power-ups
POST /api/verify-receipt  → Verify payment receipt
GET  /api/powerup-status  → Check power-up availability
```

### 📊 Analytics & Monitoring
```
GET /api/analytics        → Game analytics data
GET /api/health          → System health status
GET /api/maintenance     → Maintenance operations
```

## 🤝 Contributing

### 🔧 Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make your changes
5. Run tests: `npm run test`
6. Submit a pull request

### 📝 Code Standards
- **TypeScript** for all new code
- **ESLint** for code quality
- **Prettier** for formatting
- **Vitest** for testing
- **100% test coverage** for core logic

---

```
🍋 Built with ❤️ for Reddit Gaming 🍋

         ┌─────────────────────┐
         │   Ready to build    │
         │  the next feature?  │
         │                     │
         │  🛠️ CONTRIBUTE! 🛠️   │
         └─────────────────────┘
              ⚙️💻🎮🚀🎯
```

**© 2025 Lemonomics - Squeeze Every Drop of Fun!**

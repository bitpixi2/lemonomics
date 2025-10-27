# Lemonomics Project Structure

This document outlines the project structure for the Lemonomics video-based lemonade stand game.

## Overview

Lemonomics is a Devvit React Web Game that uses pre-rendered video assets to create an engaging lemonade stand simulation. The game follows a clean architecture with separate client, server, and shared code.

## Directory Structure

```
apps/karma-lemonade-stand/
├── public/                          # Static assets and video files
│   └── videos/                      # Video assets organized by type
│       ├── intro/                   # Introduction videos
│       ├── notepad/                 # Planning/notepad videos
│       ├── customers/               # Customer interaction videos
│       ├── money/                   # Money counting videos
│       └── leaderboard/             # Leaderboard background videos
├── src/
│   ├── client/                      # Frontend React application
│   │   ├── components/              # React components
│   │   │   └── VideoPlayer.tsx      # Video player component
│   │   ├── styles/                  # CSS stylesheets
│   │   │   └── video.css           # Video-specific styles
│   │   ├── utils/                   # Client-side utilities
│   │   │   ├── videoPreloader.ts   # Video preloading system
│   │   │   └── videoSequencer.ts   # Video sequence management
│   │   ├── app.tsx                  # Main React app component
│   │   ├── main.tsx                 # React app entry point
│   │   ├── index.html               # HTML template
│   │   ├── vite.config.ts          # Vite build configuration
│   │   └── tsconfig.json           # TypeScript configuration
│   ├── server/                      # Backend Express server
│   │   ├── api/                     # API endpoints
│   │   │   └── server.ts           # Express server setup
│   │   ├── index.ts                 # Server entry point
│   │   ├── vite.config.ts          # Server build configuration
│   │   └── tsconfig.json           # Server TypeScript config
│   └── shared/                      # Shared code between client/server
│       ├── types/                   # TypeScript type definitions
│       │   ├── game.ts             # Game-related types
│       │   ├── video.ts            # Video asset types
│       │   ├── config.ts           # Configuration types
│       │   ├── api.ts              # API types
│       │   └── index.ts            # Type exports
│       ├── utils/                   # Shared utilities
│       │   └── videoValidation.ts  # Video asset validation
│       └── redis/                   # Redis data adapters
├── dist/                            # Build output directory
│   ├── client/                      # Built client assets
│   └── server/                      # Built server bundle
├── devvit.json                      # Devvit app configuration
├── package.json                     # Dependencies and scripts
└── tsconfig.json                    # Root TypeScript configuration
```

## Key Components

### Video System

The video system is the core of the Lemonomics experience:

- **VideoPlayer**: React component for playing video assets
- **VideoPreloader**: Utility for preloading videos based on strategy
- **VideoSequencer**: Manages the flow between different video sequences
- **Video Assets**: Organized by type (intro, customers, money, etc.)

### Game Architecture

- **Client**: React-based UI with video integration
- **Server**: Express API for game logic and data persistence
- **Shared**: Common types and utilities used by both client and server

### Build System

- **Vite**: Modern build tool for both client and server
- **TypeScript**: Strict typing with project references
- **Devvit**: Reddit platform integration

## Video Asset Organization

Videos are organized by type and weather condition:

- `intro/`: Ghost character introduction
- `notepad/`: Planning interface background
- `customers/`: Weather-specific customer interactions
- `money/`: Weather-specific money counting sequences
- `leaderboard/`: Background for final scores

## Development Workflow

1. **Development**: `npm run dev` - Runs client, server, and Devvit in parallel
2. **Building**: `npm run build` - Builds both client and server
3. **Testing**: Use Devvit playtest environment for full integration testing
4. **Deployment**: `npm run deploy` - Uploads to Reddit platform

## Configuration

- **devvit.json**: Devvit app metadata and configuration
- **package.json**: Dependencies, scripts, and project metadata
- **tsconfig.json**: TypeScript project references and build settings
- **vite.config.ts**: Build configuration for client and server

## Next Steps

This structure provides the foundation for implementing the video-based lemonade stand game. Future tasks will build upon this structure to add:

- Game logic and state management
- Video sequence implementation
- User interface overlays
- Server API endpoints
- Data persistence with Redis
- Reddit integration features

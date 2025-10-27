# Audio Assets for Lemonomics

This directory contains all audio assets for the Lemonomics lemonade stand game.

## Directory Structure

```
audio/
├── background/
│   ├── intro-music.mp3          # Background music for intro screen
│   ├── gameplay-music.mp3       # Background music during gameplay
│   ├── results-music.mp3        # Background music for results screen
│   └── leaderboard-music.mp3    # Background music for leaderboard
└── effects/
    ├── coin-sound.mp3           # Sound when earning money
    ├── purchase-sound.mp3       # Sound when buying ingredients
    ├── success-sound.mp3        # Sound for achievements
    ├── button-click.mp3         # UI button click sound
    └── weather-sounds/
        ├── sunny-ambience.mp3   # Sunny day background sounds
        ├── windy-ambience.mp3   # Windy day background sounds
        └── rainy-ambience.mp3   # Rainy day background sounds
```

## Audio Requirements

### Technical Specifications
- **Format**: MP3 or OGG (MP3 recommended for broader compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps - 320kbps (192kbps recommended)
- **Channels**: Stereo or Mono
- **Duration**: Varies by type (see below)

### Audio Types and Durations

#### Background Music
- **Intro Music**: 30-60 seconds (can loop)
- **Gameplay Music**: 2-5 minutes (should loop seamlessly)
- **Results Music**: 30-60 seconds
- **Leaderboard Music**: 1-2 minutes (can loop)

#### Sound Effects
- **Coin Sound**: 0.5-1 second
- **Purchase Sound**: 0.5-1 second  
- **Success Sound**: 1-2 seconds
- **Button Click**: 0.1-0.3 seconds
- **Weather Ambience**: 10-30 seconds (can loop)

## Implementation Notes

### Audio Integration
- Audio files are loaded via standard HTML5 Audio API
- Background music should have seamless loop points
- Sound effects should be short and punchy
- Consider mobile data usage - compress appropriately

### Volume Levels
- Background music: 30-50% volume by default
- Sound effects: 70-80% volume by default
- Provide user volume controls
- Respect browser autoplay policies

### Mobile Considerations
- iOS Safari requires user interaction before playing audio
- Android browsers may have different autoplay restrictions
- Provide visual feedback when audio is muted/playing
- Consider battery usage on mobile devices

## Usage in Code

```typescript
// Background music
const backgroundMusic = new Audio('/audio/background/gameplay-music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

// Sound effects
const coinSound = new Audio('/audio/effects/coin-sound.mp3');
coinSound.volume = 0.7;
```

## File Naming Convention

- Use lowercase with hyphens: `intro-music.mp3`
- Be descriptive: `sunny-day-ambience.mp3`
- Include weather variants where applicable
- Keep names short but clear

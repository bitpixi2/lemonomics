# 🔊 Lemonomics Audio Assets

This directory contains all the sound effects and music for the Lemonomics game.

## 📁 Directory Structure

```
audio/
├── effects/          # Sound effects
│   ├── lemonade-pour.mp3     # ✅ Game startup/welcome sound
│   ├── lemon-squeeze.mp3     # When making lemonade
│   ├── cash-register.mp3     # When earning money
│   ├── customer-happy.mp3    # Happy customer reactions
│   ├── customer-sad.mp3      # Disappointed customers
│   ├── rain.mp3              # Rainy weather ambience
│   ├── wind.mp3              # Windy weather
│   ├── victory-fanfare.mp3   # Leaderboard wins
│   ├── dice-roll.mp3         # Random events
│   ├── button-click.mp3      # UI interactions
│   └── notification.mp3      # Alerts and bonuses
├── music/            # Background music
│   ├── main-theme.mp3        # Default background
│   ├── festival-halloween.mp3 # Halloween theme
│   ├── festival-christmas.mp3 # Christmas theme
│   ├── festival-summer.mp3    # Summer theme
│   └── festival-medieval.mp3  # Medieval theme
└── ambient/          # Ambient sounds
    ├── market-chatter.mp3    # Background market sounds
    ├── birds-chirping.mp3    # Sunny day ambience
    └── thunder.mp3           # Storm sounds
```

## 🎵 Recommended Audio Formats

- **Format**: MP3 or OGG (for web compatibility)
- **Quality**: 128-192 kbps (balance of quality and file size)
- **Length**:
  - Sound effects: 0.5-3 seconds
  - Music loops: 30-120 seconds
  - Ambient sounds: 10-60 seconds

## 🎮 Usage in Game

These sounds will be triggered by:

- **Game actions** (selling lemonade, earning money)
- **Weather changes** (rain, wind, sunny)
- **Customer interactions** (happy/sad reactions)
- **Festival themes** (background music changes)
- **UI interactions** (button clicks, notifications)
- **Special events** (leaderboard wins, bonuses)

## 📝 Implementation Notes

- All audio files should be optimized for web delivery
- Consider mobile data usage - keep file sizes reasonable
- Provide volume controls for accessibility
- Include mute/unmute functionality
- Test audio on different devices and browsers

## 🔧 Adding New Sounds

1. Place audio files in the appropriate subdirectory
2. Update the audio manager in `src/client/services/audio-manager.ts`
3. Add sound triggers in relevant game components
4. Test across different browsers and devices

## 🎯 Priority Sounds to Add First

1. **lemonade-pour.mp3** - ✅ ADDED! Welcome sound when game starts
2. **lemon-squeeze.mp3** - Core game action (making lemonade)
3. **cash-register.mp3** - Money earned feedback
4. **button-click.mp3** - UI responsiveness
5. **main-theme.mp3** - Background ambience
6. **victory-fanfare.mp3** - Achievement celebration

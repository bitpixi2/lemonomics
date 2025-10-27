# Video Assets for Lemonomics

This directory contains all video assets for the Lemonomics lemonade stand game. The videos use the original naming convention with weather prefixes.

## File Structure

```
videos/
├── Sunny_IntroScreen.mp4           # Sunny weather introduction
├── Windy_IntroScreen.mp4           # Windy weather introduction  
├── Rainy_IntroScreen.mp4           # Rainy weather introduction
├── Sunny_IngredientScreen.mp4      # Ingredient selection on sunny days
├── Windy_IngredientScreen.mp4      # Ingredient selection on windy days
├── Rainy_IngredientScreen.mp4      # Ingredient selection on rainy days
├── Sunny_CustomersScreen.mp4       # Customers buying on sunny days
├── Windy_CustomersScreen.mp4       # Customers buying on windy days
├── Rainy_CustomerScreen.mp4        # Customers buying on rainy days
├── Sunny_LoadingResultsScreen.mp4  # Loading animation for sunny day results
├── Windy_LoadingResultsScreen.mp4  # Loading animation for windy day results
├── Rainy_LoadingResultsScreen.mp4  # Loading animation for rainy day results
├── Sunny_ResultsScreen.mp4         # Results display for sunny days
├── Windy_ResultsScreen.mp4         # Results display for windy days
├── Rainy_ResultsScreen.mp4         # Results display for rainy days
└── LeaderboardScreen.mp4           # Final leaderboard screen
```

## Video Requirements

### Technical Specifications
- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1920x1080 (1080p) or 1280x720 (720p)
- **Frame Rate**: 30fps or 24fps
- **Audio**: AAC codec, stereo, 44.1kHz
- **Duration**: Varies by video type (see below)

### Video Types and Durations

#### Intro Videos (Weather-Specific)
- **Duration**: 10-15 seconds each
- **Content**: Weather-appropriate introduction scenes
- **Purpose**: Set the mood and introduce the day's weather
- **UI**: "Start Game" button appears after video ends
- **Variations**: Sunny, Windy, Rainy themes

#### Ingredient Videos (Weather-Specific)
- **Duration**: Loop-friendly (5-10 seconds)
- **Content**: Ingredient selection interface backgrounds
- **Purpose**: Background for interactive ingredient purchasing
- **UI**: Interactive ingredient selection overlaid on video
- **Variations**: Weather-themed backgrounds for immersion

#### Customer Videos (Weather-Specific)
- **Duration**: 8-12 seconds each
- **Content**: Customers approaching and buying lemonade
- **Purpose**: Show the selling phase with weather-appropriate customer behavior
- **Variations**:
  - **Sunny**: Happy customers, busy scene
  - **Windy**: Customers dealing with wind, moderate activity
  - **Rainy**: Fewer customers, umbrellas, hurried purchases

#### Loading Results Videos (Weather-Specific)
- **Duration**: 3-5 seconds each
- **Content**: Loading animation or transition effects
- **Purpose**: Build anticipation before showing daily results
- **Variations**: Weather-themed loading animations

#### Results Videos (Weather-Specific)
- **Duration**: 5-8 seconds each
- **Content**: Results display backgrounds
- **Purpose**: Background for showing day number, earnings, and navigation
- **UI**: Day results and navigation buttons overlaid
- **Variations**: Weather-appropriate result presentation

#### Leaderboard Screen (`leaderboard-screen.mp4`)
- **Duration**: Loop-friendly (10-15 seconds)
- **Content**: Final leaderboard background
- **Purpose**: Visual backdrop for final scores and rankings
- **UI**: Leaderboard data and "Play Again" button overlaid

## Implementation Notes

### Preloading Strategy
- **Intro videos**: Preloaded on app start
- **Weather videos**: Preloaded based on random weather selection
- **Leaderboard**: Loaded when needed

### Mobile Optimization
- Videos should be optimized for mobile playback
- Consider providing multiple quality options for different connection speeds
- Ensure videos work with mobile browser autoplay policies

### Fallback Handling
- Static images should be available as fallbacks
- Loading states should be implemented for slow connections
- Error handling for failed video loads

## Placeholder Files

Currently, all video files are placeholder text files. Replace these with actual MP4 video files matching the specifications above.

To replace a placeholder:
1. Remove the existing `.mp4` file (which is currently a text file)
2. Add your actual MP4 video file with the same filename
3. Test the video in the game to ensure proper playback

## Testing

After adding real video files:
1. Test video playback on desktop browsers
2. Test on mobile devices (iOS Safari, Android Chrome)
3. Verify smooth transitions between video sequences
4. Check that UI overlays align properly with video content
5. Test with slow network connections

import type { GameResult, ResultPost, PostButton } from '../../shared/types/game.js';

/**
 * Service for generating Reddit result posts with images and action buttons
 * Creates mobile-friendly posts with verification information
 */
export class PostGenerator {
  private readonly APP_NAME = 'Karma Lemonade Stand';
  private readonly VERIFICATION_FOOTER = 'Verified by Kiro';

  /**
   * Generate a complete result post for Reddit
   * @param gameResult - Game result data
   * @param username - Player's username
   * @param dayNumber - Current day number
   * @returns ResultPost with title, image, and buttons
   */
  async generateResultPost(
    gameResult: GameResult,
    username: string,
    dayNumber: number
  ): Promise<ResultPost> {
    // Generate post title
    const title = this.generatePostTitle(gameResult, username, dayNumber);

    // Generate result card image
    const imageUrl = await this.generateResultCardImage(gameResult, username, dayNumber);

    // Create action buttons
    const buttons = this.createActionButtons();

    // Create verification footer
    const footer = this.createVerificationFooter(gameResult.seed);

    return {
      title,
      imageUrl,
      buttons,
      footer,
    };
  }

  /**
   * Generate formatted post title
   * @param gameResult - Game result data
   * @param username - Player's username
   * @param dayNumber - Current day number
   * @returns Formatted post title
   */
  private generatePostTitle(
    gameResult: GameResult,
    username: string,
    dayNumber: number
  ): string {
    const profit = gameResult.profit;
    const profitFormatted = profit >= 0 
      ? `+$${profit.toFixed(2)}` 
      : `-$${Math.abs(profit).toFixed(2)}`;
    
    const weatherEmoji = this.getWeatherEmoji(gameResult.weather);
    const resultEmoji = profit >= 0 ? '📈' : '📉';

    return `${resultEmoji} Day ${dayNumber}: ${username} made ${profitFormatted} ${weatherEmoji} | ${this.APP_NAME}`;
  }

  /**
   * Generate result card image
   * @param gameResult - Game result data
   * @param username - Player's username
   * @param dayNumber - Current day number
   * @returns Promise<string> - Image URL
   */
  private async generateResultCardImage(
    gameResult: GameResult,
    username: string,
    dayNumber: number
  ): Promise<string> {
    // Create result card data
    const cardData = {
      username,
      dayNumber,
      profit: gameResult.profit,
      cupsSold: gameResult.cupsSold,
      weather: gameResult.weather,
      event: gameResult.event,
      festival: gameResult.festival,
      streak: gameResult.streak,
      powerupsUsed: gameResult.powerupsApplied.length > 0,
    };

    // Generate image using canvas or image generation service
    // For now, return a placeholder URL that would be replaced with actual image generation
    return await this.createResultCardCanvas(cardData);
  }

  /**
   * Create result card image using canvas
   * @param cardData - Data for the result card
   * @returns Promise<string> - Base64 data URL or hosted image URL
   */
  private async createResultCardCanvas(cardData: {
    username: string;
    dayNumber: number;
    profit: number;
    cupsSold: number;
    weather: string;
    event: string;
    festival: string;
    streak: number;
    powerupsUsed: boolean;
  }): Promise<string> {
    // This would typically use a canvas library or image generation service
    // For now, we'll create a simple HTML-based card that can be converted to image
    
    // In a real implementation, this would:
    // 1. Use puppeteer or similar to render HTML to image
    // 2. Use a canvas library to draw the card
    // 3. Use an image generation service
    
    // For now, return a placeholder that indicates the card structure
    return `data:image/svg+xml;base64,${Buffer.from(this.generateCardSvg(cardData)).toString('base64')}`;
  }



  /**
   * Generate SVG for result card (simpler alternative to HTML)
   * @param cardData - Card data
   * @returns SVG string
   */
  private generateCardSvg(cardData: {
    username: string;
    dayNumber: number;
    profit: number;
    cupsSold: number;
    weather: string;
    event: string;
    festival: string;
    streak: number;
    powerupsUsed: boolean;
  }): string {
    const profitColor = cardData.profit >= 0 ? '#22c55e' : '#ef4444';
    const profitSign = cardData.profit >= 0 ? '+' : '';
    const weatherEmoji = this.getWeatherEmoji(cardData.weather);
    const powerupIndicator = cardData.powerupsUsed ? '⚡' : '';

    return `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="300" rx="16" fill="url(#bg)"/>
        
        <!-- Header -->
        <text x="24" y="40" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
          🍋 Day ${cardData.dayNumber}
        </text>
        <text x="376" y="40" fill="white" font-family="Arial, sans-serif" font-size="14" text-anchor="end">
          ${cardData.username} ${powerupIndicator}
        </text>
        
        <!-- Profit -->
        <text x="200" y="120" fill="${profitColor}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle">
          ${profitSign}$${Math.abs(cardData.profit).toFixed(2)}
        </text>
        <text x="200" y="140" fill="white" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" opacity="0.8">
          ${cardData.cupsSold} cups sold
        </text>
        
        <!-- Weather -->
        <text x="80" y="200" fill="white" font-family="Arial, sans-serif" font-size="20" text-anchor="middle">
          ${weatherEmoji}
        </text>
        <text x="80" y="220" fill="white" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">
          ${cardData.weather}
        </text>
        
        <!-- Festival -->
        <text x="320" y="200" fill="white" font-family="Arial, sans-serif" font-size="20" text-anchor="middle">
          🎪
        </text>
        <text x="320" y="220" fill="white" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">
          ${cardData.festival.slice(0, 12)}
        </text>
        
        <!-- Streak -->
        ${cardData.streak > 1 ? `
          <text x="200" y="260" fill="white" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">
            🔥 ${cardData.streak} day streak!
          </text>
        ` : ''}
      </svg>
    `;
  }

  /**
   * Create action buttons for the post
   * @returns Array of PostButton objects
   */
  private createActionButtons(): PostButton[] {
    return [
      {
        label: '🍋 Start Your Stand',
        action: 'open_app',
      },
      {
        label: '🏆 View Leaderboard',
        action: 'view_leaderboard',
      },
    ];
  }

  /**
   * Create verification footer with partial seed
   * @param seed - Game seed for verification
   * @returns Verification footer string
   */
  private createVerificationFooter(seed: string): string {
    // Show only first 8 characters of seed for verification
    const partialSeed = seed.slice(0, 8);
    return `${this.VERIFICATION_FOOTER} | Seed: ${partialSeed}...`;
  }

  /**
   * Get weather emoji for display
   * @param weather - Weather type
   * @returns Weather emoji
   */
  private getWeatherEmoji(weather: string): string {
    const weatherEmojis: Record<string, string> = {
      SUNNY: '☀️',
      HOT: '🔥',
      CLOUDY: '☁️',
      RAINY: '🌧️',
      COLD: '🥶',
    };
    
    return weatherEmojis[weather] || '🌤️';
  }



  /**
   * Format post for mobile display
   * Ensures the post looks good on mobile Reddit apps
   * @param post - Result post
   * @returns Mobile-optimized post
   */
  public optimizeForMobile(post: ResultPost): ResultPost {
    return {
      ...post,
      title: this.truncateTitle(post.title, 300), // Reddit title limit
      buttons: post.buttons.map(button => ({
        ...button,
        label: this.truncateButtonLabel(button.label, 20),
      })),
    };
  }

  /**
   * Truncate title to fit Reddit limits
   * @param title - Original title
   * @param maxLength - Maximum length
   * @returns Truncated title
   */
  private truncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) {
      return title;
    }
    
    return title.slice(0, maxLength - 3) + '...';
  }

  /**
   * Truncate button label for mobile display
   * @param label - Original label
   * @param maxLength - Maximum length
   * @returns Truncated label
   */
  private truncateButtonLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) {
      return label;
    }
    
    return label.slice(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const postGenerator = new PostGenerator();

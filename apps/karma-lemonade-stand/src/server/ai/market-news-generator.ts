import { aiService } from './ai-service.js';
import { WeatherType, MarketEvent } from '../../shared/types/game.js';

export interface MarketNews {
  headline: string;
  story: string;
  impact: string;
  timestamp: string;
}

export class MarketNewsGenerator {
  private fallbackNews: Record<string, MarketNews[]> = {
    [WeatherType.SUNNY]: [
      {
        headline: "☀️ Perfect Weather Boosts Lemonade Sales",
        story: "Local meteorologists report ideal conditions for outdoor refreshment sales. Citizens are flocking to parks and sidewalks.",
        impact: "Increased foot traffic expected",
        timestamp: new Date().toISOString(),
      },
      {
        headline: "🌞 Heat Wave Creates Thirsty Customers",
        story: "The sunny skies have everyone looking for cool, refreshing drinks. Lemonade stands are seeing record demand.",
        impact: "High demand for cold beverages",
        timestamp: new Date().toISOString(),
      },
    ],
    [WeatherType.RAINY]: [
      {
        headline: "🌧️ Rainy Day Keeps Customers Indoors",
        story: "Unexpected showers have reduced foot traffic significantly. Smart vendors are offering delivery services.",
        impact: "Lower customer turnout expected",
        timestamp: new Date().toISOString(),
      },
      {
        headline: "☔ Weather Advisory Affects Street Sales",
        story: "The rain has created challenging conditions for outdoor vendors. Only the most dedicated customers are venturing out.",
        impact: "Reduced sales volume likely",
        timestamp: new Date().toISOString(),
      },
    ],
    [WeatherType.HOT]: [
      {
        headline: "🔥 Record Heat Drives Lemonade Demand",
        story: "Temperatures soaring past normal levels have created a surge in demand for cold, refreshing beverages.",
        impact: "Exceptional sales opportunities",
        timestamp: new Date().toISOString(),
      },
    ],
    [WeatherType.CLOUDY]: [
      {
        headline: "☁️ Overcast Skies Create Steady Business",
        story: "Mild, cloudy conditions provide comfortable shopping weather. Customers are taking leisurely strolls.",
        impact: "Normal business conditions",
        timestamp: new Date().toISOString(),
      },
    ],
    [WeatherType.COLD]: [
      {
        headline: "❄️ Cold Snap Challenges Beverage Sales",
        story: "Unseasonably cold weather has customers reaching for hot drinks instead of cold refreshments.",
        impact: "Significantly reduced demand",
        timestamp: new Date().toISOString(),
      },
    ],
    [MarketEvent.VIRAL]: [
      {
        headline: "🚀 Social Media Trend Boosts Lemonade Sales",
        story: "A viral video featuring creative lemonade recipes has sparked massive interest in artisanal beverages.",
        impact: "Explosive demand increase",
        timestamp: new Date().toISOString(),
      },
    ],
    [MarketEvent.SUGAR_SHORT]: [
      {
        headline: "🍋 Lemon Shortage Affects Supply Chains",
        story: "Agricultural reports indicate a temporary shortage of quality lemons, driving up ingredient costs.",
        impact: "Higher costs, reduced margins",
        timestamp: new Date().toISOString(),
      },
    ],
    [MarketEvent.INFLATION]: [
      {
        headline: "💸 Economic Pressures Impact Consumer Spending",
        story: "Rising costs across the board have made consumers more price-conscious about discretionary purchases.",
        impact: "Price sensitivity increased",
        timestamp: new Date().toISOString(),
      },
    ],
    [MarketEvent.NONE]: [
      {
        headline: "📈 Steady Market Conditions Continue",
        story: "Business conditions remain stable with consistent customer demand and normal operating costs.",
        impact: "Standard business environment",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  /**
   * Generate daily market news based on current conditions
   */
  async generateDailyNews(
    weather: WeatherType,
    event: MarketEvent,
    festival?: string
  ): Promise<MarketNews> {
    const context = this.buildContext(weather, event, festival);
    const fallback = this.getFallbackNews(weather, event);

    if (!aiService.isAvailable()) {
      return fallback;
    }

    const prompt = `Generate a news headline and short story (2-3 sentences) about today's lemonade stand business conditions:

Weather: ${weather}
Market Event: ${event}
${festival ? `Festival: ${festival}` : ''}

The news should be:
- Family-friendly and fun
- Relevant to lemonade stand business
- Include an impact statement
- Written like a local business news report

Format:
Headline: [catchy headline with emoji]
Story: [2-3 sentence story]
Impact: [brief business impact]`;

    try {
      const aiResponse = await aiService.generateContent(prompt, '');
      
      if (aiResponse && aiResponse !== '') {
        const parsed = this.parseAIResponse(aiResponse);
        if (parsed) {
          return {
            ...parsed,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('Failed to generate AI news:', error);
    }

    return fallback;
  }

  /**
   * Parse AI response into structured news format
   */
  private parseAIResponse(response: string): Omit<MarketNews, 'timestamp'> | null {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      
      let headline = '';
      let story = '';
      let impact = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('headline:')) {
          headline = trimmed.substring(9).trim();
        } else if (trimmed.toLowerCase().startsWith('story:')) {
          story = trimmed.substring(6).trim();
        } else if (trimmed.toLowerCase().startsWith('impact:')) {
          impact = trimmed.substring(7).trim();
        }
      }

      if (headline && story && impact) {
        return { headline, story, impact };
      }

      // Fallback parsing - treat as single story
      if (response.length > 10) {
        const sentences = response.split('.').filter(s => s.trim());
        if (sentences.length >= 2) {
          return {
            headline: sentences[0].trim() + '.',
            story: sentences.slice(1).join('.').trim() + '.',
            impact: 'Market conditions may vary',
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return null;
    }
  }

  /**
   * Build context string for AI prompt
   */
  private buildContext(weather: WeatherType, event: MarketEvent, festival?: string): string {
    let context = `Today's weather is ${weather} and there's a ${event} market event.`;
    
    if (festival) {
      context += ` The ${festival} festival is also happening, which adds special atmosphere to the business environment.`;
    }

    return context;
  }

  /**
   * Get fallback news for when AI is unavailable
   */
  private getFallbackNews(weather: WeatherType, event: MarketEvent): MarketNews {
    // Prioritize event-based news (unless it's NONE), then weather-based
    let newsPool;
    
    if (event !== MarketEvent.NONE && this.fallbackNews[event]) {
      newsPool = this.fallbackNews[event];
    } else if (this.fallbackNews[weather]) {
      newsPool = this.fallbackNews[weather];
    } else {
      newsPool = this.fallbackNews[MarketEvent.NONE];
    }

    const randomIndex = Math.floor(Math.random() * newsPool.length);
    
    return {
      ...newsPool[randomIndex],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate breaking news for special events
   */
  async generateBreakingNews(eventType: string, context: string): Promise<MarketNews> {
    const fallback: MarketNews = {
      headline: "🚨 Breaking: Special Market Event",
      story: "Unexpected market conditions have created new opportunities for savvy lemonade entrepreneurs.",
      impact: "Adapt quickly to maximize profits",
      timestamp: new Date().toISOString(),
    };

    if (!aiService.isAvailable()) {
      return fallback;
    }

    const prompt = `Generate breaking news for a lemonade stand game:

Event Type: ${eventType}
Context: ${context}

Create urgent, exciting news that would affect lemonade stand business. Keep it fun and family-friendly.

Format:
Headline: [urgent headline with emoji]
Story: [2-3 exciting sentences]
Impact: [business impact]`;

    try {
      const aiResponse = await aiService.generateContent(prompt, '');
      const parsed = this.parseAIResponse(aiResponse);
      
      if (parsed) {
        return {
          ...parsed,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to generate breaking news:', error);
    }

    return fallback;
  }
}

// Singleton instance
export const marketNewsGenerator = new MarketNewsGenerator();

import { aiService } from './ai-service.js';
import { WeatherType, MarketEvent } from '../../shared/types/game.js';

export interface CustomerDialogue {
  customerType: string;
  greeting: string;
  reaction: string;
  comment: string;
  mood: 'happy' | 'neutral' | 'disappointed' | 'excited';
}

export class CustomerDialogueGenerator {
  private fallbackDialogues: Record<string, CustomerDialogue[]> = {
    happy: [
      {
        customerType: "Cheerful Kid",
        greeting: "Hi! Can I have some lemonade please?",
        reaction: "Wow, this is really good!",
        comment: "I'm definitely coming back tomorrow!",
        mood: 'happy',
      },
      {
        customerType: "Friendly Neighbor",
        greeting: "What a lovely lemonade stand!",
        reaction: "Perfect price for such quality!",
        comment: "You're going to do great in business!",
        mood: 'happy',
      },
    ],
    neutral: [
      {
        customerType: "Casual Walker",
        greeting: "I'll take one lemonade, please.",
        reaction: "Not bad, thanks.",
        comment: "Have a good day.",
        mood: 'neutral',
      },
      {
        customerType: "Busy Parent",
        greeting: "Quick lemonade for my kid?",
        reaction: "That'll do, thanks.",
        comment: "Come on honey, we need to go.",
        mood: 'neutral',
      },
    ],
    disappointed: [
      {
        customerType: "Price-Conscious Shopper",
        greeting: "How much for lemonade?",
        reaction: "That's a bit steep for me.",
        comment: "Maybe I'll try somewhere else.",
        mood: 'disappointed',
      },
      {
        customerType: "Skeptical Customer",
        greeting: "Is this fresh lemonade?",
        reaction: "Hmm, not quite what I expected.",
        comment: "I've had better elsewhere.",
        mood: 'disappointed',
      },
    ],
    excited: [
      {
        customerType: "Lemonade Enthusiast",
        greeting: "OMG, I LOVE lemonade stands!",
        reaction: "This is AMAZING! Best lemonade ever!",
        comment: "I'm telling all my friends about this place!",
        mood: 'excited',
      },
      {
        customerType: "Festival Goer",
        greeting: "Perfect timing! I'm so thirsty!",
        reaction: "Exactly what I needed!",
        comment: "This festival just got even better!",
        mood: 'excited',
      },
    ],
  };

  /**
   * Generate customer dialogue based on game conditions
   */
  async generateCustomerDialogue(
    weather: WeatherType,
    event: MarketEvent,
    price: number,
    serviceLevel: number,
    festival?: string
  ): Promise<CustomerDialogue> {
    const mood = this.determineMood(weather, event, price, serviceLevel);
    const fallback = this.getFallbackDialogue(mood);

    if (!aiService.isAvailable()) {
      return fallback;
    }

    const prompt = `Generate dialogue for a customer at a lemonade stand:

Conditions:
- Weather: ${weather}
- Market Event: ${event}
- Price: $${price.toFixed(2)}
- Service Level: ${serviceLevel}/10
${festival ? `- Festival: ${festival}` : ''}

Customer should be ${mood} based on these conditions.

Create realistic, family-friendly dialogue with:
- Customer type (e.g., "Happy Kid", "Busy Parent")
- Initial greeting
- Reaction to the lemonade
- Parting comment

Keep it natural and conversational. Match the mood: ${mood}.

Format:
Customer Type: [type]
Greeting: [what they say when approaching]
Reaction: [response after trying/buying]
Comment: [parting words]`;

    try {
      const aiResponse = await aiService.generateContent(prompt, '');
      
      if (aiResponse && aiResponse !== '') {
        const parsed = this.parseDialogueResponse(aiResponse, mood);
        if (parsed) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to generate AI dialogue:', error);
    }

    return fallback;
  }

  /**
   * Generate multiple customer interactions for a busy day
   */
  async generateMultipleCustomers(
    weather: WeatherType,
    event: MarketEvent,
    price: number,
    serviceLevel: number,
    count: number = 3,
    festival?: string
  ): Promise<CustomerDialogue[]> {
    const promises = Array(count).fill(null).map(() =>
      this.generateCustomerDialogue(weather, event, price, serviceLevel, festival)
    );

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Failed to generate multiple customers:', error);
      // Return fallback dialogues
      return Array(count).fill(null).map(() => {
        const mood = this.determineMood(weather, event, price, serviceLevel);
        return this.getFallbackDialogue(mood);
      });
    }
  }

  /**
   * Parse AI response into dialogue structure
   */
  private parseDialogueResponse(response: string, mood: CustomerDialogue['mood']): CustomerDialogue | null {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      
      let customerType = '';
      let greeting = '';
      let reaction = '';
      let comment = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('customer type:')) {
          customerType = trimmed.substring(14).trim();
        } else if (trimmed.toLowerCase().startsWith('greeting:')) {
          greeting = trimmed.substring(9).trim();
        } else if (trimmed.toLowerCase().startsWith('reaction:')) {
          reaction = trimmed.substring(9).trim();
        } else if (trimmed.toLowerCase().startsWith('comment:')) {
          comment = trimmed.substring(8).trim();
        }
      }

      if (customerType && greeting && reaction && comment) {
        return {
          customerType,
          greeting,
          reaction,
          comment,
          mood,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to parse dialogue response:', error);
      return null;
    }
  }

  /**
   * Determine customer mood based on conditions
   */
  private determineMood(
    weather: WeatherType,
    event: MarketEvent,
    price: number,
    serviceLevel: number
  ): CustomerDialogue['mood'] {
    let moodScore = 0;

    // Weather impact
    switch (weather) {
      case WeatherType.HOT:
        moodScore += 2; // Love cold drinks when hot
        break;
      case WeatherType.SUNNY:
        moodScore += 1;
        break;
      case WeatherType.CLOUDY:
        moodScore += 0;
        break;
      case WeatherType.RAINY:
        moodScore -= 1;
        break;
      case WeatherType.COLD:
        moodScore -= 2;
        break;
    }

    // Event impact
    switch (event) {
      case MarketEvent.VIRAL:
        moodScore += 2;
        break;
      case MarketEvent.NONE:
        moodScore += 0;
        break;
      case MarketEvent.SUGAR_SHORT:
        moodScore -= 1;
        break;
      case MarketEvent.INFLATION:
        moodScore -= 1;
        break;
    }

    // Price impact (assuming $0.25-$5.00 range)
    if (price <= 1.0) {
      moodScore += 1; // Great value
    } else if (price >= 3.0) {
      moodScore -= 1; // Expensive
    }

    // Service level impact
    if (serviceLevel >= 8) {
      moodScore += 1;
    } else if (serviceLevel <= 4) {
      moodScore -= 1;
    }

    // Convert score to mood
    if (moodScore >= 3) return 'excited';
    if (moodScore >= 1) return 'happy';
    if (moodScore >= -1) return 'neutral';
    return 'disappointed';
  }

  /**
   * Get fallback dialogue when AI is unavailable
   */
  private getFallbackDialogue(mood: CustomerDialogue['mood']): CustomerDialogue {
    const dialogues = this.fallbackDialogues[mood] || this.fallbackDialogues.neutral;
    const randomIndex = Math.floor(Math.random() * dialogues.length);
    return dialogues[randomIndex];
  }

  /**
   * Generate special festival customer dialogue
   */
  async generateFestivalCustomer(festival: string, mood: CustomerDialogue['mood']): Promise<CustomerDialogue> {
    const fallback = this.getFallbackDialogue(mood);

    if (!aiService.isAvailable()) {
      return {
        ...fallback,
        customerType: "Festival Visitor",
        comment: `This ${festival} festival is amazing!`,
      };
    }

    const prompt = `Generate dialogue for a customer at a lemonade stand during the ${festival} festival:

The customer should be ${mood} and reference the festival theme.
Make it fun and themed to the festival while keeping it family-friendly.

Format:
Customer Type: [festival-themed type]
Greeting: [festival-themed greeting]
Reaction: [response to lemonade with festival reference]
Comment: [parting words about festival]`;

    try {
      const aiResponse = await aiService.generateContent(prompt, '');
      const parsed = this.parseDialogueResponse(aiResponse, mood);
      
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      console.error('Failed to generate festival dialogue:', error);
    }

    return {
      ...fallback,
      customerType: "Festival Visitor",
      comment: `This ${festival} festival is amazing!`,
    };
  }
}

// Singleton instance
export const customerDialogueGenerator = new CustomerDialogueGenerator();

import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI only if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate AI content with fallback to deterministic content
   */
  async generateContent(prompt: string, fallback: string): Promise<string> {
    if (!this.isAvailable()) {
      return fallback;
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a creative writer for a lemonade stand business simulation game. Keep responses concise, fun, and family-friendly.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content?.trim() || fallback;
    } catch (error) {
      console.error('AI generation failed:', error);
      return fallback;
    }
  }

  /**
   * Generate multiple AI responses and return the best one
   */
  async generateMultiple(prompt: string, count: number, fallback: string): Promise<string> {
    if (!this.isAvailable()) {
      return fallback;
    }

    try {
      const promises = Array(count).fill(null).map(() => 
        this.generateContent(prompt, fallback)
      );
      
      const results = await Promise.all(promises);
      
      // Return the longest non-fallback response, or fallback if all failed
      const validResults = results.filter(r => r !== fallback);
      if (validResults.length === 0) {
        return fallback;
      }
      
      return validResults.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    } catch (error) {
      console.error('Multiple AI generation failed:', error);
      return fallback;
    }
  }
}

// Singleton instance
export const aiService = new AIService();

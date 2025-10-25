import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../server/ai/ai-service.js';
import { MarketNewsGenerator } from '../../server/ai/market-news-generator.js';
import { CustomerDialogueGenerator } from '../../server/ai/customer-dialogue-generator.js';
import { WeatherType, MarketEvent } from '../../shared/types/game.js';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mock AI response'
            }
          }]
        })
      }
    }
  }))
}));

describe('AI Services', () => {
  describe('AIService', () => {
    let aiService: AIService;

    beforeEach(() => {
      // Clear environment variables
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();
    });

    it('should detect when API key is not available', () => {
      expect(aiService.isAvailable()).toBe(false);
    });

    it('should detect when API key is available', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const serviceWithKey = new AIService();
      expect(serviceWithKey.isAvailable()).toBe(true);
    });

    it('should return fallback content when AI is not available', async () => {
      const result = await aiService.generateContent('test prompt', 'fallback content');
      expect(result).toBe('fallback content');
    });

    it('should handle AI generation errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const serviceWithKey = new AIService();
      
      // Mock OpenAI to throw an error
      const mockOpenAI = vi.mocked(serviceWithKey['openai']);
      if (mockOpenAI) {
        mockOpenAI.chat = {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        } as any;
      }

      const result = await serviceWithKey.generateContent('test prompt', 'fallback content');
      expect(result).toBe('fallback content');
    });
  });

  describe('MarketNewsGenerator', () => {
    let newsGenerator: MarketNewsGenerator;

    beforeEach(() => {
      newsGenerator = new MarketNewsGenerator();
    });

    it('should generate fallback news when AI is unavailable', async () => {
      const news = await newsGenerator.generateDailyNews(
        WeatherType.SUNNY,
        MarketEvent.NONE
      );

      expect(news).toHaveProperty('headline');
      expect(news).toHaveProperty('story');
      expect(news).toHaveProperty('impact');
      expect(news).toHaveProperty('timestamp');
      expect(typeof news.headline).toBe('string');
      expect(typeof news.story).toBe('string');
      expect(typeof news.impact).toBe('string');
    });

    it('should generate weather-appropriate fallback news', async () => {
      const sunnyNews = await newsGenerator.generateDailyNews(
        WeatherType.SUNNY,
        MarketEvent.NONE
      );

      const rainyNews = await newsGenerator.generateDailyNews(
        WeatherType.RAINY,
        MarketEvent.NONE
      );

      // Should generate news with appropriate structure
      expect(sunnyNews.headline).toBeTruthy();
      expect(rainyNews.headline).toBeTruthy();
      expect(sunnyNews.story).toBeTruthy();
      expect(rainyNews.story).toBeTruthy();
      
      // Different weather should produce different content
      expect(sunnyNews.headline).not.toBe(rainyNews.headline);
    });

    it('should generate event-specific fallback news', async () => {
      const viralNews = await newsGenerator.generateDailyNews(
        WeatherType.SUNNY,
        MarketEvent.VIRAL
      );

      expect(viralNews.headline).toContain('🚀');
    });

    it('should generate breaking news', async () => {
      const breakingNews = await newsGenerator.generateBreakingNews(
        'special-event',
        'Test context'
      );

      expect(breakingNews).toHaveProperty('headline');
      expect(breakingNews).toHaveProperty('story');
      expect(breakingNews).toHaveProperty('impact');
      expect(breakingNews.headline).toContain('🚨');
    });
  });

  describe('CustomerDialogueGenerator', () => {
    let dialogueGenerator: CustomerDialogueGenerator;

    beforeEach(() => {
      dialogueGenerator = new CustomerDialogueGenerator();
    });

    it('should generate fallback dialogue when AI is unavailable', async () => {
      const dialogue = await dialogueGenerator.generateCustomerDialogue(
        WeatherType.SUNNY,
        MarketEvent.NONE,
        1.50,
        8
      );

      expect(dialogue).toHaveProperty('customerType');
      expect(dialogue).toHaveProperty('greeting');
      expect(dialogue).toHaveProperty('reaction');
      expect(dialogue).toHaveProperty('comment');
      expect(dialogue).toHaveProperty('mood');
      expect(['happy', 'neutral', 'disappointed', 'excited']).toContain(dialogue.mood);
    });

    it('should determine mood based on conditions', async () => {
      // Hot weather + low price should make customers happy
      const happyDialogue = await dialogueGenerator.generateCustomerDialogue(
        WeatherType.HOT,
        MarketEvent.VIRAL,
        0.50,
        9
      );

      // Cold weather + high price should disappoint customers
      const sadDialogue = await dialogueGenerator.generateCustomerDialogue(
        WeatherType.COLD,
        MarketEvent.INFLATION,
        4.00,
        3
      );

      expect(['happy', 'excited']).toContain(happyDialogue.mood);
      expect(['disappointed', 'neutral']).toContain(sadDialogue.mood);
    });

    it('should generate multiple customer interactions', async () => {
      const interactions = await dialogueGenerator.generateMultipleCustomers(
        WeatherType.SUNNY,
        MarketEvent.NONE,
        1.50,
        8,
        3
      );

      expect(interactions).toHaveLength(3);
      interactions.forEach(dialogue => {
        expect(dialogue).toHaveProperty('customerType');
        expect(dialogue).toHaveProperty('greeting');
        expect(dialogue).toHaveProperty('reaction');
        expect(dialogue).toHaveProperty('comment');
        expect(dialogue).toHaveProperty('mood');
      });
    });

    it('should generate festival-themed dialogue', async () => {
      const festivalDialogue = await dialogueGenerator.generateFestivalCustomer(
        'Halloween Spooky',
        'excited'
      );

      expect(festivalDialogue.mood).toBe('excited');
      expect(festivalDialogue.customerType).toBe('Festival Visitor');
      expect(festivalDialogue.comment).toContain('Halloween Spooky');
    });

    it('should handle price sensitivity in mood calculation', async () => {
      // Test very low price (should be positive)
      const cheapDialogue = await dialogueGenerator.generateCustomerDialogue(
        WeatherType.CLOUDY,
        MarketEvent.NONE,
        0.25,
        5
      );

      // Test very high price (should be negative)
      const expensiveDialogue = await dialogueGenerator.generateCustomerDialogue(
        WeatherType.CLOUDY,
        MarketEvent.NONE,
        4.50,
        5
      );

      // Cheap price should generally result in better mood than expensive price
      const moodScores = {
        'excited': 4,
        'happy': 3,
        'neutral': 2,
        'disappointed': 1
      };

      const cheapScore = moodScores[cheapDialogue.mood];
      const expensiveScore = moodScores[expensiveDialogue.mood];

      expect(cheapScore).toBeGreaterThanOrEqual(expensiveScore);
    });
  });

  describe('AI Content Integration', () => {
    it('should handle missing environment variables gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      
      const aiService = new AIService();
      const newsGenerator = new MarketNewsGenerator();
      const dialogueGenerator = new CustomerDialogueGenerator();

      expect(aiService.isAvailable()).toBe(false);
      expect(() => newsGenerator).not.toThrow();
      expect(() => dialogueGenerator).not.toThrow();
    });

    it('should provide consistent fallback content', async () => {
      const newsGenerator = new MarketNewsGenerator();
      
      // Generate the same conditions multiple times
      const news1 = await newsGenerator.generateDailyNews(WeatherType.SUNNY, MarketEvent.NONE);
      const news2 = await newsGenerator.generateDailyNews(WeatherType.SUNNY, MarketEvent.NONE);

      // Should be consistent structure even if content varies
      expect(news1).toHaveProperty('headline');
      expect(news1).toHaveProperty('story');
      expect(news1).toHaveProperty('impact');
      expect(news2).toHaveProperty('headline');
      expect(news2).toHaveProperty('story');
      expect(news2).toHaveProperty('impact');
    });
  });
});

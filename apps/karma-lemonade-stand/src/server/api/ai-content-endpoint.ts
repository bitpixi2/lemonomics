import { Request, Response } from 'express';
import { marketNewsGenerator } from '../ai/market-news-generator.js';
import { customerDialogueGenerator } from '../ai/customer-dialogue-generator.js';
import { WeatherType, MarketEvent } from '../../shared/types/game.js';

/**
 * Get daily market news
 * GET /api/market-news?weather=SUNNY&event=NONE&festival=halloween
 */
export async function getMarketNews(req: Request, res: Response): Promise<void> {
  try {
    const { weather, event, festival } = req.query;

    // Validate parameters
    if (!weather || !Object.values(WeatherType).includes(weather as WeatherType)) {
      res.status(400).json({ error: 'Invalid weather parameter' });
      return;
    }

    if (!event || !Object.values(MarketEvent).includes(event as MarketEvent)) {
      res.status(400).json({ error: 'Invalid event parameter' });
      return;
    }

    const news = await marketNewsGenerator.generateDailyNews(
      weather as WeatherType,
      event as MarketEvent,
      festival as string
    );

    res.json({
      success: true,
      news,
      aiEnabled: marketNewsGenerator['aiService']?.isAvailable() || false,
    });
  } catch (error) {
    console.error('Market news generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate market news',
      success: false,
    });
  }
}

/**
 * Get customer dialogue
 * GET /api/customer-dialogue?weather=SUNNY&event=NONE&price=1.50&service=8&festival=halloween
 */
export async function getCustomerDialogue(req: Request, res: Response): Promise<void> {
  try {
    const { weather, event, price, service, festival } = req.query;

    // Validate parameters
    if (!weather || !Object.values(WeatherType).includes(weather as WeatherType)) {
      res.status(400).json({ error: 'Invalid weather parameter' });
      return;
    }

    if (!event || !Object.values(MarketEvent).includes(event as MarketEvent)) {
      res.status(400).json({ error: 'Invalid event parameter' });
      return;
    }

    const priceNum = parseFloat(price as string);
    const serviceNum = parseInt(service as string, 10);

    if (isNaN(priceNum) || priceNum < 0 || priceNum > 10) {
      res.status(400).json({ error: 'Invalid price parameter' });
      return;
    }

    if (isNaN(serviceNum) || serviceNum < 0 || serviceNum > 10) {
      res.status(400).json({ error: 'Invalid service parameter' });
      return;
    }

    const dialogue = await customerDialogueGenerator.generateCustomerDialogue(
      weather as WeatherType,
      event as MarketEvent,
      priceNum,
      serviceNum,
      festival as string
    );

    res.json({
      success: true,
      dialogue,
      aiEnabled: customerDialogueGenerator['aiService']?.isAvailable() || false,
    });
  } catch (error) {
    console.error('Customer dialogue generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate customer dialogue',
      success: false,
    });
  }
}

/**
 * Get multiple customer interactions for busy periods
 * GET /api/customer-interactions?weather=HOT&event=VIRAL&price=2.00&service=9&count=5&festival=summer
 */
export async function getCustomerInteractions(req: Request, res: Response): Promise<void> {
  try {
    const { weather, event, price, service, count = '3', festival } = req.query;

    // Validate parameters
    if (!weather || !Object.values(WeatherType).includes(weather as WeatherType)) {
      res.status(400).json({ error: 'Invalid weather parameter' });
      return;
    }

    if (!event || !Object.values(MarketEvent).includes(event as MarketEvent)) {
      res.status(400).json({ error: 'Invalid event parameter' });
      return;
    }

    const priceNum = parseFloat(price as string);
    const serviceNum = parseInt(service as string, 10);
    const countNum = parseInt(count as string, 10);

    if (isNaN(priceNum) || priceNum < 0 || priceNum > 10) {
      res.status(400).json({ error: 'Invalid price parameter' });
      return;
    }

    if (isNaN(serviceNum) || serviceNum < 0 || serviceNum > 10) {
      res.status(400).json({ error: 'Invalid service parameter' });
      return;
    }

    if (isNaN(countNum) || countNum < 1 || countNum > 10) {
      res.status(400).json({ error: 'Invalid count parameter (1-10)' });
      return;
    }

    const interactions = await customerDialogueGenerator.generateMultipleCustomers(
      weather as WeatherType,
      event as MarketEvent,
      priceNum,
      serviceNum,
      countNum,
      festival as string
    );

    res.json({
      success: true,
      interactions,
      count: interactions.length,
      aiEnabled: customerDialogueGenerator['aiService']?.isAvailable() || false,
    });
  } catch (error) {
    console.error('Customer interactions generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate customer interactions',
      success: false,
    });
  }
}

/**
 * Get breaking news for special events
 * POST /api/breaking-news
 * Body: { eventType: string, context: string }
 */
export async function getBreakingNews(req: Request, res: Response): Promise<void> {
  try {
    const { eventType, context } = req.body;

    if (!eventType || typeof eventType !== 'string') {
      res.status(400).json({ error: 'Event type is required' });
      return;
    }

    if (!context || typeof context !== 'string') {
      res.status(400).json({ error: 'Context is required' });
      return;
    }

    const news = await marketNewsGenerator.generateBreakingNews(eventType, context);

    res.json({
      success: true,
      news,
      aiEnabled: marketNewsGenerator['aiService']?.isAvailable() || false,
    });
  } catch (error) {
    console.error('Breaking news generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate breaking news',
      success: false,
    });
  }
}

/**
 * Get AI service status
 * GET /api/ai-status
 */
export async function getAIStatus(req: Request, res: Response): Promise<void> {
  try {
    const newsAI = marketNewsGenerator['aiService']?.isAvailable() || false;
    const dialogueAI = customerDialogueGenerator['aiService']?.isAvailable() || false;

    res.json({
      success: true,
      status: {
        marketNews: newsAI,
        customerDialogue: dialogueAI,
        overall: newsAI && dialogueAI,
      },
      message: newsAI && dialogueAI 
        ? 'AI services are fully operational'
        : 'AI services are using fallback content (set OPENAI_API_KEY to enable)',
    });
  } catch (error) {
    console.error('AI status check failed:', error);
    res.status(500).json({ 
      error: 'Failed to check AI status',
      success: false,
    });
  }
}

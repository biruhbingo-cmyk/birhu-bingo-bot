// Vercel types - available at runtime in Vercel environment
type VercelRequest = {
  method?: string;
  body?: any;
  [key: string]: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  [key: string]: any;
};
import { initializeBot, getBot } from '../src/bot/bot';

// Initialize bot on first import (for serverless cold starts)
let botInitialized = false;

async function ensureBotInitialized() {
  if (!botInitialized) {
    try {
      await initializeBot();
      botInitialized = true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      throw error;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure bot is initialized
    await ensureBotInitialized();
    const bot = getBot();
    
    // Process the update from Telegram
    await bot.processUpdate(req.body);
    
    // Return 200 OK immediately to acknowledge receipt
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


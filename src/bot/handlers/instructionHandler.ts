import TelegramBot from 'node-telegram-bot-api';
import { MESSAGES } from '../utils/messages';
import { getInstructionKeyboard } from '../utils/keyboards';

/**
 * Normalizes and validates a URL to ensure it's properly formatted for Telegram web_app
 */
function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: URL is empty or not a string');
  }

  // Trim whitespace
  let normalized = url.trim();

  // Remove any leading/trailing whitespace
  normalized = normalized.replace(/^\s+|\s+$/g, '');

  // Remove protocol if present (we'll add https://)
  normalized = normalized.replace(/^https?:\/\//i, '');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Remove any path that might be included (we only want the domain)
  const pathMatch = normalized.match(/^([^\/]+)/);
  if (pathMatch) {
    normalized = pathMatch[1];
  }

  // Ensure it's not empty
  if (!normalized) {
    throw new Error('Invalid URL: URL is empty after normalization');
  }

  // Construct the full HTTPS URL
  const fullUrl = `https://${normalized}`;

  // Validate using URL constructor
  try {
    const urlObj = new URL(fullUrl);
    // Return normalized URL without trailing slash
    return urlObj.href.replace(/\/$/, '');
  } catch (error) {
    throw new Error(`Invalid URL format: ${normalized}`);
  }
}

export function setupInstructionHandler(bot: TelegramBot) {
  bot.onText(/\/instruction/, async (msg) => {
    const chatId = msg.chat.id;
    let instructionUrl = '';

    try {
      // Get frontend URL from environment or use default
      const frontendUrlEnv = process.env.FRONTEND_URL || 'biruh-bingo-frontend-production.up.railway.app';
      
      // Normalize the URL
      const normalizedFrontendUrl = normalizeUrl(frontendUrlEnv);
      
      // Construct instruction URL
      instructionUrl = `${normalizedFrontendUrl}/instruction`;
      
      console.log('Frontend URL (env):', frontendUrlEnv);
      console.log('Normalized frontend URL:', normalizedFrontendUrl);
      console.log('Instruction URL:', instructionUrl);
      
      const keyboard = getInstructionKeyboard(instructionUrl);
      
      await bot.sendMessage(chatId, '📖 Click the button below to view instructions:', keyboard);
    } catch (error: any) {
      console.error('Instruction error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
      });
      
      const errorMessage = `❌ Error opening instructions. Please try again.\n\n🔗 URL: ${instructionUrl || 'Not generated'}\n\nError: ${error?.message || 'Unknown error'}`;
      await bot.sendMessage(chatId, errorMessage);
    }
  });
}


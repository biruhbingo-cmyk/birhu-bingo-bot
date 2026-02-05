import TelegramBot from 'node-telegram-bot-api';
import { MESSAGES } from '../utils/messages';
import { getInstructionKeyboard } from '../utils/keyboards';

export function setupInstructionHandler(bot: TelegramBot) {
  bot.onText(/\/instruction/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      // Get frontend URL from environment or use default
      let frontendUrl = process.env.FRONTEND_URL || 'https://biruh-bingo-frontend-production.up.railway.app';
      
      // Ensure HTTPS is used (Telegram web_app requires HTTPS)
      if (frontendUrl.startsWith('http://')) {
        frontendUrl = frontendUrl.replace('http://', 'https://');
      } else if (!frontendUrl.startsWith('https://')) {
        frontendUrl = `https://${frontendUrl}`;
      }
      
      // Remove trailing slash if present
      frontendUrl = frontendUrl.replace(/\/$/, '');
      
      const instructionUrl = `${frontendUrl}/instruction`;
      
      console.log('Instruction URL:', instructionUrl); // Debug log
      
      const keyboard = getInstructionKeyboard(instructionUrl);
      
      await bot.sendMessage(chatId, '', keyboard);
    } catch (error: any) {
      console.error('Instruction error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
      });
      await bot.sendMessage(chatId, '❌ Error opening instructions. Please try again.');
    }
  });
}


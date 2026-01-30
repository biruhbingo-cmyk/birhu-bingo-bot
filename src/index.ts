import dotenv from 'dotenv';
import { initializeBot } from './bot/bot';

dotenv.config();

// Initialize and start the Telegram bot
initializeBot()
  .then(() => {
    console.log('✅ Telegram bot is running');
  })
  .catch((error) => {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  });


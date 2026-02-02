import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

if (!webhookUrl) {
  console.error('❌ WEBHOOK_URL is not set');
  console.error('Please set WEBHOOK_URL to your Vercel deployment URL (e.g., https://your-app.vercel.app/api/webhook)');
  process.exit(1);
}

const bot = new TelegramBot(token);

async function setupWebhook() {
  try {
    // Set webhook URL
    await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    
    // Get webhook info to verify
    const webhookInfo = await bot.getWebHookInfo();
    console.log('📋 Webhook Info:');
    console.log(JSON.stringify(webhookInfo, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    process.exit(1);
  }
}

setupWebhook();


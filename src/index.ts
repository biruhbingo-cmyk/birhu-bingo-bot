import dotenv from 'dotenv';
import http from 'http';
import { initializeBot } from './bot/bot';

dotenv.config();

// Initialize and start the Telegram bot
initializeBot()
  .then(() => {
    console.log('✅ Telegram bot is running');
    
    // Start a simple HTTP server for Render (required for web services)
    // This doesn't affect the bot functionality, but Render needs a port to be open
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        service: 'biruh-bingo-bot',
        message: 'Bot is running' 
      }));
    });
    
    server.listen(port, () => {
      console.log(`🌐 Health check server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  });


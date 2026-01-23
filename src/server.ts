import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { initializeBot } from './bot/bot';
import { setupWebSocket } from './websocket/websocket';
import gameRoutes from './routes/game.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Normalize origin URL (remove trailing slash)
const normalizeOrigin = (url: string): string => {
  return url.replace(/\/+$/, '');
};

// Get allowed origins
const getAllowedOrigins = (): string[] => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const normalized = normalizeOrigin(frontendUrl);
  // Allow both with and without trailing slash
  return [normalized, `${normalized}/`];
};

const allowedOrigins = getAllowedOrigins();

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(allowed => normalizeOrigin(origin) === normalizeOrigin(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware - CORS with origin normalization
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Normalize and check if origin is allowed
    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.some(allowed => normalizeOrigin(allowed) === normalizedOrigin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trial-bingo')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Drop email index if it exists (from previous schema)
    try {
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('users').dropIndex('email_1').catch(() => {
          // Index doesn't exist, ignore
        });
        console.log('✅ Cleaned up email index');
      }
    } catch (error) {
      // Ignore errors
    }
    
    // Initialize cards if needed
    const { initializeCards } = await import('./game/cardGenerator');
    await initializeCards();
    
    // Setup WebSocket first
    setupWebSocket(io);
    
    // Set IO instance for game engine
    const { setIOInstance } = await import('./game/gameEngine');
    setIOInstance(io);
    
    // Initialize Telegram Bot
    initializeBot(io);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export { io };


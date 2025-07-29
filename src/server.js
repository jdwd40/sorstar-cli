import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { AuthController } from './controllers/AuthController.js';
import { GameController } from './controllers/GameController.js';
import { MarketController } from './controllers/MarketController.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);

// Game endpoints
app.get('/ships', GameController.getShips);
app.get('/planets', GameController.getPlanets);
app.get('/game/state', authenticateToken, GameController.getGameState);
app.post('/game/start', authenticateToken, GameController.startGame);
app.post('/game/travel', authenticateToken, GameController.travel);

app.get('/market/:planetId', MarketController.getMarketPrices);
app.get('/cargo', authenticateToken, MarketController.getCargo);
app.post('/buy', authenticateToken, MarketController.buyCommodity);
app.post('/sell', authenticateToken, MarketController.sellCommodity);

app.get('/stats', authenticateToken, GameController.getStats);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Sorstar API Server running on port ${PORT}`);
    console.log(`📖 API Documentation:`);
    console.log(`   POST /auth/register - Create account`);
    console.log(`   POST /auth/login - Login`);
    console.log(`   GET  /ships - Get available ships`);
    console.log(`   GET  /planets - Get all planets`);
    console.log(`   GET  /game/state - Get game state (auth required)`);
    console.log(`   POST /game/start - Start new game (auth required)`);
    console.log(`   POST /game/travel - Travel to planet (auth required)`);
    console.log(`   GET  /market/:planetId - Get market prices`);
    console.log(`   GET  /cargo - Get cargo inventory (auth required)`);
    console.log(`   POST /buy - Buy commodity (auth required)`);
    console.log(`   POST /sell - Sell commodity (auth required)`);
    console.log(`   GET  /stats - Get game stats (auth required)`);
    console.log(`   GET  /health - Health check`);
  });
};

export { app, startServer };
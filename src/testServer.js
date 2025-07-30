import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Switch to test database before importing controllers
import { useTestDatabase } from './utils/dbConnection.js';
useTestDatabase();

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

// Rate limiting - more permissive for tests
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // limit each IP to 1000 requests per minute for tests
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

export { app as testApp };
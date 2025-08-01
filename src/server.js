import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AuthController } from './controllers/AuthController.js';
import { GameController } from './controllers/GameController.js';
import { MarketController } from './controllers/MarketController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware - disable CSP for development to allow inline scripts
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());

// Rate limiting - more permissive for development/gaming
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // limit each IP to 1000 requests per minute (very generous for gaming)
});
app.use(limiter);

// Serve static files (web interface)
app.use(express.static(projectRoot));

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

// Fuel system endpoints
app.get('/game/fuel', authenticateToken, GameController.getFuelInfo);
app.post('/game/fuel/buy', authenticateToken, GameController.buyFuel);
app.get('/game/travel/cost/:planetId', authenticateToken, GameController.getTravelCost);

// Enhanced planet endpoints
app.get('/planets/:planetId/details', GameController.getPlanetDetails);
app.get('/planets/:planetId/distance', authenticateToken, GameController.getPlanetDistanceInfo);

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

// Serve web interface root
app.get('/', (req, res) => {
  res.redirect('/sorstar-web.html');
});

// 404 handler for API endpoints only
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 404 handler for other requests
app.use((req, res) => {
  // If it's an API request, return JSON error
  if (req.path.startsWith('/auth') || req.path.startsWith('/game') || 
      req.path.startsWith('/market') || req.path.startsWith('/cargo') || 
      req.path.startsWith('/buy') || req.path.startsWith('/sell') || 
      req.path.startsWith('/ships') || req.path.startsWith('/planets') || 
      req.path.startsWith('/stats') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  // For non-API requests, serve 404 page or redirect to main interface
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head><title>404 - Not Found</title></head>
    <body>
      <h1>Page Not Found</h1>
      <p><a href="/sorstar-web.html">Return to Sorstar Web Interface</a></p>
    </body>
    </html>
  `);
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Sorstar API Server running on port ${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}/sorstar-web.html`);
    console.log(`📖 API Documentation:`);
    console.log(`   POST /auth/register - Create account`);
    console.log(`   POST /auth/login - Login`);
    console.log(`   GET  /ships - Get available ships`);
    console.log(`   GET  /planets - Get all planets`);
    console.log(`   GET  /game/state - Get game state (auth required)`);
    console.log(`   POST /game/start - Start new game (auth required)`);
    console.log(`   POST /game/travel - Travel to planet (auth required)`);
    console.log(`   ⛽  Fuel System:`);
    console.log(`   GET  /game/fuel - Get fuel info (auth required)`);
    console.log(`   POST /game/fuel/buy - Buy fuel (auth required)`);
    console.log(`   GET  /game/travel/cost/:id - Get travel cost (auth required)`);
    console.log(`   🌍 Enhanced Planets:`);
    console.log(`   GET  /planets/:id/details - Get planet details`);
    console.log(`   GET  /planets/:id/distance - Get distance info (auth required)`);
    console.log(`   📦 Trading:`);
    console.log(`   GET  /market/:planetId - Get market prices`);
    console.log(`   GET  /cargo - Get cargo inventory (auth required)`);
    console.log(`   POST /buy - Buy commodity (auth required)`);
    console.log(`   POST /sell - Sell commodity (auth required)`);
    console.log(`   GET  /stats - Get game stats (auth required)`);
    console.log(`   GET  /health - Health check`);
  });
};

export { app, startServer };
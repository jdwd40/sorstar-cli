import request from 'supertest';
import { app } from '../src/server.js';
import { createTestUser, createAuthHeaders, testGameData } from './helpers.js';

describe('Gameplay Endpoints', () => {
  let authToken;
  let user;
  let gameState;

  beforeEach(async () => {
    const testUser = await createTestUser();
    user = testUser.user;
    authToken = testUser.token;

    // Create a game for gameplay tests
    await request(app)
      .post('/game/start')
      .set(createAuthHeaders(authToken))
      .send({ shipId: testGameData.shipId });

    // Get game state
    const gameResponse = await request(app)
      .get('/game/state')
      .set(createAuthHeaders(authToken));
    
    gameState = gameResponse.body;
  });

  describe('GET /market/:planetId', () => {
    test('should return market prices for valid planet', async () => {
      const response = await request(app)
        .get(`/market/${gameState.current_planet_id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          commodity_id: expect.any(Number),
          commodity_name: expect.any(String),
          buy_price: expect.any(Number),
          sell_price: expect.any(Number),
          stock: expect.any(Number)
        });
      }
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get(`/market/${gameState.current_planet_id}`)
        .expect(200);

      expect(response.status).toBe(200);
    });

    test('should handle invalid planet ID', async () => {
      const response = await request(app)
        .get('/market/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid planet ID'
      });
    });

    test('should handle non-existent planet ID', async () => {
      const response = await request(app)
        .get('/market/99999')
        .expect(200);

      // Should return empty array for non-existent planet
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /cargo', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/cargo')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should return empty cargo for new game', async () => {
      const response = await request(app)
        .get('/cargo')
        .set(createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        cargo: [],
        totalCargo: 0,
        cargoCapacity: expect.any(Number)
      });
    });

    test('should return error for user without game', async () => {
      const { token: newToken } = await createTestUser('noGameUser2', 'password');

      const response = await request(app)
        .get('/cargo')
        .set(createAuthHeaders(newToken))
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'No game found for user'
      });
    });
  });

  describe('GET /stats', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/stats')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should return game statistics', async () => {
      const response = await request(app)
        .get('/stats')
        .set(createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          username: user.username
        },
        game: {
          credits: expect.any(Number),
          turnsUsed: expect.any(Number),
          currentPlanet: expect.any(String),
          ship: expect.any(String),
          cargoCapacity: expect.any(Number),
          totalCargo: expect.any(Number)
        }
      });
    });

    test('should return error for user without game', async () => {
      const { token: newToken } = await createTestUser('noGameUser3', 'password');

      const response = await request(app)
        .get('/stats')
        .set(createAuthHeaders(newToken))
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'No game found for user'
      });
    });
  });

  describe('POST /buy', () => {
    let availableCommodity;

    beforeEach(async () => {
      // Get market data to find an available commodity
      const marketResponse = await request(app)
        .get(`/market/${gameState.current_planet_id}`);
      
      availableCommodity = marketResponse.body.find(c => c.stock > 0);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/buy')
        .send({ commodityId: 1, quantity: 1 })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should buy commodity successfully', async () => {
      if (!availableCommodity) {
        console.log('No commodities available for testing buy endpoint');
        return;
      }

      const buyData = {
        commodityId: availableCommodity.commodity_id,
        quantity: 1
      };

      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(authToken))
        .send(buyData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('Purchased'),
        gameState: expect.objectContaining({
          credits: expect.any(Number)
        }),
        totalCost: availableCommodity.buy_price
      });

      // Verify credits were deducted
      expect(response.body.gameState.credits).toBe(gameState.credits - availableCommodity.buy_price);
    });

    test('should reject buy without commodityId', async () => {
      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(authToken))
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject buy without quantity', async () => {
      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(authToken))
        .send({ commodityId: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject buy with invalid quantity', async () => {
      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(authToken))
        .send({ commodityId: 1, quantity: 0 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject buy for user without game', async () => {
      const { token: newToken } = await createTestUser('noGameUser4', 'password');

      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(newToken))
        .send({ commodityId: 1, quantity: 1 })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'No game found for user'
      });
    });

    test('should reject buy with insufficient credits', async () => {
      if (!availableCommodity) return;

      // Try to buy more than we can afford
      const expensiveQuantity = Math.floor(gameState.credits / availableCommodity.buy_price) + 10;

      const response = await request(app)
        .post('/buy')
        .set(createAuthHeaders(authToken))
        .send({ 
          commodityId: availableCommodity.commodity_id, 
          quantity: expensiveQuantity 
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Insufficient credits'
      });
    });
  });

  describe('POST /sell', () => {
    let purchasedCommodity;

    beforeEach(async () => {
      // First buy something to sell
      const marketResponse = await request(app)
        .get(`/market/${gameState.current_planet_id}`);
      
      const availableCommodity = marketResponse.body.find(c => c.stock > 0);
      
      if (availableCommodity) {
        await request(app)
          .post('/buy')
          .set(createAuthHeaders(authToken))
          .send({ 
            commodityId: availableCommodity.commodity_id, 
            quantity: 2 
          });

        purchasedCommodity = availableCommodity;
      }
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/sell')
        .send({ commodityId: 1, quantity: 1 })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should sell commodity successfully', async () => {
      if (!purchasedCommodity) {
        console.log('No commodities available for testing sell endpoint');
        return;
      }

      const sellData = {
        commodityId: purchasedCommodity.commodity_id,
        quantity: 1
      };

      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(authToken))
        .send(sellData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('Sold'),
        gameState: expect.objectContaining({
          credits: expect.any(Number)
        }),
        totalEarned: expect.any(Number)
      });
    });

    test('should reject sell without commodityId', async () => {
      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(authToken))
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject sell without quantity', async () => {
      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(authToken))
        .send({ commodityId: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject sell with invalid quantity', async () => {
      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(authToken))
        .send({ commodityId: 1, quantity: 0 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Valid commodity ID and quantity required'
      });
    });

    test('should reject sell for user without game', async () => {
      const { token: newToken } = await createTestUser('noGameUser5', 'password');

      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(newToken))
        .send({ commodityId: 1, quantity: 1 })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'No game found for user'
      });
    });

    test('should reject sell with insufficient cargo', async () => {
      // Try to sell a commodity we don't have
      const response = await request(app)
        .post('/sell')
        .set(createAuthHeaders(authToken))
        .send({ commodityId: 999, quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Insufficient cargo to sell'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Endpoint not found'
      });
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send('invalid json')
        .expect(400);
    });
  });
});
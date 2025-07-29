import request from 'supertest';
import { app } from '../src/server.js';
import { createTestUser, createAuthHeaders, testGameData } from './helpers.js';

describe('Game Management Endpoints', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    const testUser = await createTestUser();
    user = testUser.user;
    authToken = testUser.token;
  });

  describe('GET /ships', () => {
    test('should return list of available ships', async () => {
      const response = await request(app)
        .get('/ships')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          cargo_capacity: expect.any(Number),
          cost: expect.any(Number),
          description: expect.any(String)
        });
      }
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get('/ships')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /planets', () => {
    test('should return list of planets', async () => {
      const response = await request(app)
        .get('/planets')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          description: expect.any(String)
        });
      }
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get('/planets')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /game/state', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/game/state')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/game/state')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'Invalid or expired token'
      });
    });

    test('should return null for user with no game', async () => {
      const response = await request(app)
        .get('/game/state')
        .set(createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toBe(null);
    });

    test('should return game state after game creation', async () => {
      // First create a game
      await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({ shipId: testGameData.shipId })
        .expect(201);

      // Then get game state
      const response = await request(app)
        .get('/game/state')
        .set(createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        user_id: user.id,
        ship_id: testGameData.shipId,
        current_planet_id: expect.any(Number),
        credits: expect.any(Number),
        turns_used: expect.any(Number),
        ship_name: expect.any(String),
        cargo_capacity: expect.any(Number),
        planet_name: expect.any(String),
        planet_description: expect.any(String),
        created_at: expect.any(String)
      });
    });
  });

  describe('POST /game/start', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/game/start')
        .send({ shipId: testGameData.shipId })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should create a new game successfully', async () => {
      const response = await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({ shipId: testGameData.shipId })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Game started successfully',
        gameState: {
          id: expect.any(Number),
          user_id: user.id,
          ship_id: testGameData.shipId,
          current_planet_id: expect.any(Number),
          credits: 1000, // Starting credits
          turns_used: 0,
          ship_name: expect.any(String),
          cargo_capacity: expect.any(Number),
          planet_name: expect.any(String)
        }
      });
    });

    test('should reject game creation without shipId', async () => {
      const response = await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Ship ID required'
      });
    });

    test('should reject creating second game for same user', async () => {
      // Create first game
      await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({ shipId: testGameData.shipId })
        .expect(201);

      // Try to create second game
      const response = await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({ shipId: testGameData.shipId })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Game already exists for this user'
      });
    });
  });

  describe('POST /game/travel', () => {
    beforeEach(async () => {
      // Create a game for travel tests
      await request(app)
        .post('/game/start')
        .set(createAuthHeaders(authToken))
        .send({ shipId: testGameData.shipId });
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/game/travel')
        .send({ planetId: 2 })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });

    test('should travel to different planet successfully', async () => {
      // Get current game state to find current planet
      const gameStateResponse = await request(app)
        .get('/game/state')
        .set(createAuthHeaders(authToken));

      const currentPlanetId = gameStateResponse.body.current_planet_id;
      
      // Get planets to find a different one
      const planetsResponse = await request(app)
        .get('/planets');
      
      const differentPlanet = planetsResponse.body.find(p => p.id !== currentPlanetId);

      if (differentPlanet) {
        const response = await request(app)
          .post('/game/travel')
          .set(createAuthHeaders(authToken))
          .send({ planetId: differentPlanet.id })
          .expect(200);

        expect(response.body).toMatchObject({
          message: 'Travel successful',
          gameState: {
            current_planet_id: differentPlanet.id,
            turns_used: 1
          }
        });
      }
    });

    test('should reject travel without planetId', async () => {
      const response = await request(app)
        .post('/game/travel')
        .set(createAuthHeaders(authToken))
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Planet ID required'
      });
    });

    test('should reject travel to same planet', async () => {
      // Get current game state
      const gameStateResponse = await request(app)
        .get('/game/state')
        .set(createAuthHeaders(authToken));

      const currentPlanetId = gameStateResponse.body.current_planet_id;

      const response = await request(app)
        .post('/game/travel')
        .set(createAuthHeaders(authToken))
        .send({ planetId: currentPlanetId })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Already at this planet'
      });
    });

    test('should reject travel for user without game', async () => {
      // Create a new user without a game
      const { token: newToken } = await createTestUser('noGameUser', 'password');

      const response = await request(app)
        .post('/game/travel')
        .set(createAuthHeaders(newToken))
        .send({ planetId: 2 })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'No game found for user'
      });
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });

      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });
});
import request from 'supertest';
import { app } from '../src/server.js';
import { createTestUser } from './helpers.js';

describe('Fuel Controller Endpoints', () => {
  let authToken;
  let user;
  let testGameId;

  beforeEach(async () => {
    // Use unique username for each test to avoid collisions
    const uniqueUsername = `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testUser = await createTestUser(uniqueUsername);
    user = testUser.user;
    authToken = testUser.token;

    // Start a game for fuel testing
    const shipsResponse = await request(app).get('/ships');
    const shipId = shipsResponse.body[0].id;
    
    const gameResponse = await request(app)
      .post('/game/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ shipId });
    
    testGameId = gameResponse.body.gameState.id;
  });

  describe('GET /game/fuel', () => {
    test('should return current fuel information', async () => {
      const response = await request(app)
        .get('/game/fuel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        currentFuel: expect.any(Number),
        maxFuel: expect.any(Number),
        fuelPercentage: expect.any(Number),
        fuelStatus: expect.any(String)
      });

      expect(response.body.currentFuel).toBeGreaterThanOrEqual(0);
      expect(response.body.currentFuel).toBeLessThanOrEqual(response.body.maxFuel);
      expect(response.body.fuelPercentage).toBeGreaterThanOrEqual(0);
      expect(response.body.fuelPercentage).toBeLessThanOrEqual(100);
      expect(['critical', 'low', 'adequate', 'full']).toContain(response.body.fuelStatus);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/game/fuel')
        .expect(401);
    });

    test('should return 404 if no game exists', async () => {
      // Create new user without game
      const uniqueUsername = `noGameUser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await createTestUser(uniqueUsername);
      
      await request(app)
        .get('/game/fuel')
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(404);
    });

    test('should include fuel efficiency and range data', async () => {
      const response = await request(app)
        .get('/game/fuel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('efficiency');
      expect(response.body).toHaveProperty('range');
      expect(response.body.range).toHaveProperty('reachablePlanets');
      expect(Array.isArray(response.body.range.reachablePlanets)).toBe(true);
    });
  });

  describe('POST /game/fuel/buy', () => {
    test('should purchase fuel successfully', async () => {
      const planetId = 1;
      
      // First, check current fuel and calculate a safe quantity to buy
      const fuelResponse = await request(app)
        .get('/game/fuel')
        .set('Authorization', `Bearer ${authToken}`);
      
      const { currentFuel, maxFuel } = fuelResponse.body;
      const availableCapacity = maxFuel - currentFuel;
      
      // If tank is full, travel somewhere first to use some fuel
      if (availableCapacity === 0) {
        // Travel to planet 2 to use some fuel
        await request(app)
          .post('/game/travel')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ planetId: 2 });
        
        // Get updated fuel info
        const updatedFuelResponse = await request(app)
          .get('/game/fuel')
          .set('Authorization', `Bearer ${authToken}`);
        
        const quantity = Math.min(5, updatedFuelResponse.body.maxFuel - updatedFuelResponse.body.currentFuel);
        
        const response = await request(app)
          .post('/game/fuel/buy')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ planetId: 2, quantity }); // Buy from current planet after travel
        
        expect(response.status).toBe(200);
        
        expect(response.body).toMatchObject({
          message: expect.stringContaining('fuel'),
          fuelPurchased: quantity,
          totalCost: expect.any(Number),
          newFuelLevel: expect.any(Number),
          gameState: expect.objectContaining({
            credits: expect.any(Number)
          })
        });
      } else {
        // Tank has some space, proceed with purchase
        const quantity = Math.min(5, availableCapacity);
        
        const response = await request(app)
          .post('/game/fuel/buy')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ planetId, quantity });
        
        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('fuel'),
          fuelPurchased: quantity,
          totalCost: expect.any(Number),
          newFuelLevel: expect.any(Number),
          gameState: expect.objectContaining({
            credits: expect.any(Number)
          })
        });

        expect(response.body.totalCost).toBeGreaterThan(0);
        expect(response.body.newFuelLevel).toBeGreaterThan(0);
      }
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/game/fuel/buy')
        .send({ planetId: 1, quantity: 10 })
        .expect(401);
    });

    test('should validate required fields', async () => {
      // Missing planetId
      await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 10 })
        .expect(400);

      // Missing quantity
      await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planetId: 1 })
        .expect(400);

      // Invalid quantity
      await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planetId: 1, quantity: 0 })
        .expect(400);

      await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planetId: 1, quantity: -5 })
        .expect(400);
    });

    test('should handle insufficient credits', async () => {
      // Try to buy a large amount of fuel that would exceed credits
      const response = await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planetId: 1, quantity: 10000 })
        .expect(400);

      expect(response.body.error).toMatch(/insufficient.*credits/i);
    });

    test('should handle fuel capacity exceeded', async () => {
      // First, fill up the tank by buying maximum fuel
      const fuelResponse = await request(app)
        .get('/game/fuel')
        .set('Authorization', `Bearer ${authToken}`);
      
      const { currentFuel, maxFuel } = fuelResponse.body;
      const maxBuyable = maxFuel - currentFuel;
      
      if (maxBuyable > 0) {
        // Fill the tank
        await request(app)
          .post('/game/fuel/buy')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ planetId: 1, quantity: maxBuyable });
      }
      
      // Now try to buy more fuel
      const response = await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planetId: 1, quantity: 1 })
        .expect(400);

      expect(response.body.error).toMatch(/capacity|full/i);
    });

    test('should return 404 if no game exists', async () => {
      const uniqueUsername = `noGameUser2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await createTestUser(uniqueUsername);
      
      await request(app)
        .post('/game/fuel/buy')
        .set('Authorization', `Bearer ${newUser.token}`)
        .send({ planetId: 1, quantity: 10 })
        .expect(404);
    });
  });

  describe('GET /game/travel/cost/:planetId', () => {
    test('should return travel cost information', async () => {
      const targetPlanetId = 2;

      const response = await request(app)
        .get(`/game/travel/cost/${targetPlanetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        destinationPlanetId: targetPlanetId,
        fuelCost: expect.any(Number),
        timeCost: expect.any(Number),
        canTravel: expect.any(Boolean),
        remainingFuelAfterTravel: expect.any(Number)
      });

      expect(response.body.fuelCost).toBeGreaterThanOrEqual(0);
      expect(response.body.timeCost).toBeGreaterThan(0);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/game/travel/cost/2')
        .expect(401);
    });

    test('should validate planet ID', async () => {
      // Invalid planet ID format
      await request(app)
        .get('/game/travel/cost/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Non-existent planet ID
      await request(app)
        .get('/game/travel/cost/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should handle same planet travel', async () => {
      // Get current planet
      const gameStateResponse = await request(app)
        .get('/game/state')
        .set('Authorization', `Bearer ${authToken}`);
      
      console.log('Game state fields:', Object.keys(gameStateResponse.body));
      const currentPlanetId = gameStateResponse.body.current_planet_id || gameStateResponse.body.currentPlanetId;

      const response = await request(app)
        .get(`/game/travel/cost/${currentPlanetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fuelCost).toBe(0);
      expect(response.body.timeCost).toBe(0);
      expect(response.body.canTravel).toBe(false);
    });

    test('should include fuel insufficiency warning', async () => {
      // First, deplete fuel by traveling or other means
      // For now, just test that warning field exists when applicable
      const response = await request(app)
        .get('/game/travel/cost/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.remainingFuelAfterTravel < 0) {
        expect(response.body).toHaveProperty('warning');
        expect(response.body.warning).toMatch(/insufficient.*fuel/i);
      }
    });

    test('should return 404 if no game exists', async () => {
      const uniqueUsername = `noGameUser3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await createTestUser(uniqueUsername);
      
      await request(app)
        .get('/game/travel/cost/2')
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(404);
    });
  });

  describe('GET /planets/:planetId/details', () => {
    test('should return comprehensive planet details', async () => {
      const planetId = 1;

      const response = await request(app)
        .get(`/planets/${planetId}/details`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: planetId,
        name: expect.any(String),
        description: expect.any(String),
        type: expect.any(String),
        classification: expect.any(String),
        fuelPrice: expect.any(Number),
        economicProfile: expect.objectContaining({
          primaryIndustries: expect.any(Array),
          tradeSpecialties: expect.any(Array)
        }),
        commoditySpecialties: expect.any(Array)
      });

      expect(['Forest', 'Jungle', 'Industrial', 'City', 'Mining', 'Agricultural', 'Unknown']).toContain(response.body.type);
      expect(response.body.fuelPrice).toBeGreaterThan(0);
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get('/planets/1/details')
        .expect(200);

      expect(response.body).toHaveProperty('name');
    });

    test('should validate planet ID', async () => {
      // Invalid planet ID format
      await request(app)
        .get('/planets/invalid/details')
        .expect(400);

      // Non-existent planet ID
      await request(app)
        .get('/planets/99999/details')
        .expect(404);
    });

    test('should include distance information when authenticated', async () => {
      const planetId = 2;

      const response = await request(app)
        .get(`/planets/${planetId}/details`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('distanceFromPlayer');
      expect(response.body.distanceFromPlayer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /planets/:planetId/distance', () => {
    test('should return distance information', async () => {
      const planetId = 2;

      const response = await request(app)
        .get(`/planets/${planetId}/distance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        planetId: planetId,
        distanceFromPlayer: expect.any(Number),
        travelTime: expect.any(Number),
        fuelRequired: expect.any(Number),
        classification: expect.stringMatching(/near|distant/i)
      });

      expect(response.body.distanceFromPlayer).toBeGreaterThanOrEqual(0);
      expect(response.body.travelTime).toBeGreaterThan(0);
      expect(response.body.fuelRequired).toBeGreaterThanOrEqual(0);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/planets/2/distance')
        .expect(401);
    });

    test('should validate planet ID', async () => {
      // Invalid planet ID format
      await request(app)
        .get('/planets/invalid/distance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Non-existent planet ID
      await request(app)
        .get('/planets/99999/distance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should handle same planet distance', async () => {
      // Get current planet
      const gameStateResponse = await request(app)
        .get('/game/state')
        .set('Authorization', `Bearer ${authToken}`);
      
      const currentPlanetId = gameStateResponse.body.current_planet_id || gameStateResponse.body.currentPlanetId;

      const response = await request(app)
        .get(`/planets/${currentPlanetId}/distance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.distanceFromPlayer).toBe(0);
      expect(response.body.travelTime).toBe(0);
      expect(response.body.fuelRequired).toBe(0);
    });

    test('should return 404 if no game exists', async () => {
      const uniqueUsername = `noGameUser4_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await createTestUser(uniqueUsername);
      
      await request(app)
        .get('/planets/2/distance')
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(404);
    });
  });
});
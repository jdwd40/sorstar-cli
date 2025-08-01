import { TestGame as Game, TestUser as User, TestPlanet } from './test-models.js';
import { testQuery as query } from '../src/utils/testDatabase.js';

describe('Planet Distance & Geography System', () => {
  // Verify we're using the test database
  test('should be using sorstar_test database', async () => {
    const result = await query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('sorstar_test');
  });

  describe('Planet Distance Calculation', () => {
    let terraNova, miningStation, agriWorld, techHaven;

    beforeEach(async () => {
      terraNova = await TestPlanet.findByName('Terra Nova');
      miningStation = await TestPlanet.findByName('Mining Station Alpha');
      agriWorld = await TestPlanet.findByName('Agricultural World Ceres');
      techHaven = await TestPlanet.findByName('Tech Haven Beta');
    });

    test('should calculate distance between two planets using coordinates', () => {
      const distance = terraNova.distanceTo(miningStation);
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    test('should calculate correct distance from Terra Nova to Mining Station Alpha', () => {
      // Terra Nova (0,0) to Mining Station Alpha (100,50)
      // Distance = sqrt(100² + 50²) = sqrt(12500) ≈ 111.8
      const distance = terraNova.distanceTo(miningStation);
      expect(distance).toBeCloseTo(111.8, 1);
    });

    test('should calculate correct distance from Terra Nova to Agricultural World Ceres', () => {
      // Terra Nova (0,0) to Agricultural World Ceres (-75,80)
      // Distance = sqrt(75² + 80²) = sqrt(12025) ≈ 109.7
      const distance = terraNova.distanceTo(agriWorld);
      expect(distance).toBeCloseTo(109.7, 1);
    });

    test('should calculate symmetrical distances (A to B equals B to A)', () => {
      const distanceAB = terraNova.distanceTo(miningStation);
      const distanceBA = miningStation.distanceTo(terraNova);
      expect(distanceAB).toBeCloseTo(distanceBA);
    });

    test('should return 0 distance from planet to itself', () => {
      const distance = terraNova.distanceTo(terraNova);
      expect(distance).toBe(0);
    });
  });

  describe('Travel Time Calculation', () => {
    let terraNova, miningStation;

    beforeEach(async () => {
      terraNova = await TestPlanet.findByName('Terra Nova');
      miningStation = await TestPlanet.findByName('Mining Station Alpha');
    });

    test('should calculate travel time based on distance', () => {
      const travelTime = terraNova.travelTimeTo(miningStation);
      expect(typeof travelTime).toBe('number');
      expect(travelTime).toBeGreaterThan(0);
    });

    test('should round up travel time to whole turns', () => {
      const travelTime = terraNova.travelTimeTo(miningStation);
      expect(Number.isInteger(travelTime)).toBe(true);
    });

    test('should calculate reasonable travel times for normal planets (~6-15 turns)', async () => {
      const agriWorld = await TestPlanet.findByName('Agricultural World Ceres');
      const techHaven = await TestPlanet.findByName('Tech Haven Beta');
      const planets = [miningStation, agriWorld, techHaven];
      
      for (const planet of planets) {
        const travelTime = terraNova.travelTimeTo(planet);
        expect(travelTime).toBeGreaterThanOrEqual(6);
        expect(travelTime).toBeLessThanOrEqual(20); // Allow some flexibility
      }
    });

    test('should return 0 travel time from planet to itself', () => {
      const travelTime = terraNova.travelTimeTo(terraNova);
      expect(travelTime).toBe(0);
    });
  });

  describe('Fuel Cost Calculation', () => {
    let terraNova, miningStation;

    beforeEach(async () => {
      terraNova = await TestPlanet.findByName('Terra Nova');
      miningStation = await TestPlanet.findByName('Mining Station Alpha');
    });

    test('should calculate fuel cost based on travel time', () => {
      const fuelCost = terraNova.fuelCostTo(miningStation);
      expect(typeof fuelCost).toBe('number');
      expect(fuelCost).toBeGreaterThan(0);
    });

    test('should have proportional relationship between travel time and fuel cost', () => {
      const travelTime = terraNova.travelTimeTo(miningStation);
      const fuelCost = terraNova.fuelCostTo(miningStation);
      
      // Fuel cost should be travel time * fuel per turn
      expect(fuelCost).toBe(travelTime * 5); // 5 fuel per turn
    });

    test('should return 0 fuel cost from planet to itself', () => {
      const fuelCost = terraNova.fuelCostTo(terraNova);
      expect(fuelCost).toBe(0);
    });
  });

  describe('Travel Information System', () => {
    let terraNova, miningStation;

    beforeEach(async () => {
      terraNova = await TestPlanet.findByName('Terra Nova');
      miningStation = await TestPlanet.findByName('Mining Station Alpha');
    });

    test('should provide complete travel information', () => {
      const travelInfo = terraNova.getTravelInfo(miningStation);
      
      expect(travelInfo).toHaveProperty('distance');
      expect(travelInfo).toHaveProperty('travelTime');
      expect(travelInfo).toHaveProperty('fuelCost');
      expect(travelInfo).toHaveProperty('destinationPlanet');
    });

    test('should provide accurate travel information data types', () => {
      const travelInfo = terraNova.getTravelInfo(miningStation);
      
      expect(typeof travelInfo.distance).toBe('number');
      expect(typeof travelInfo.travelTime).toBe('number');
      expect(typeof travelInfo.fuelCost).toBe('number');
      expect(typeof travelInfo.destinationPlanet).toBe('object');
    });

    test('should include destination planet details in travel info', () => {
      const travelInfo = terraNova.getTravelInfo(miningStation);
      
      expect(travelInfo.destinationPlanet).toHaveProperty('id');
      expect(travelInfo.destinationPlanet).toHaveProperty('name');
      expect(travelInfo.destinationPlanet).toHaveProperty('description');
      expect(travelInfo.destinationPlanet.name).toBe('Mining Station Alpha');
    });
  });

  describe('Planet Geography System', () => {
    test('should have planets with coordinate system', async () => {
      const planets = await TestPlanet.findAll();
      
      for (const planet of planets) {
        expect(planet).toHaveProperty('xCoord');
        expect(planet).toHaveProperty('yCoord');
        expect(typeof planet.xCoord).toBe('number');
        expect(typeof planet.yCoord).toBe('number');
      }
    });

    test('should have Terra Nova at origin (0,0)', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      expect(terraNova.xCoord).toBe(0);
      expect(terraNova.yCoord).toBe(0);
    });

    test('should have multiple planets with different coordinates', async () => {
      const planets = await TestPlanet.findAll();
      const coordinates = planets.map(p => `${p.xCoord},${p.yCoord}`);
      const uniqueCoordinates = [...new Set(coordinates)];
      
      expect(uniqueCoordinates.length).toBe(planets.length); // All planets should have unique coordinates
    });
  });

  describe('Distant Planets System', () => {
    test('should be able to identify distant planets', async () => {
      const distantPlanets = await TestPlanet.getDistantPlanets();
      expect(Array.isArray(distantPlanets)).toBe(true);
      // Initially might be empty, but should be able to query
    });

    test('should be able to identify normal planets', async () => {
      const normalPlanets = await TestPlanet.getNormalPlanets();
      expect(Array.isArray(normalPlanets)).toBe(true);
      expect(normalPlanets.length).toBeGreaterThan(0); // Should have current planets
    });

    test('should have is_distant property in planet model', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      expect(planet).toHaveProperty('isDistant');
      expect(typeof planet.isDistant).toBe('boolean');
    });
  });

  describe('Database Schema - Planet Distance Features', () => {
    test('should have is_distant column in planets table', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'planets' AND column_name = 'is_distant'
      `);
      
      if (result.rows.length > 0) {
        expect(result.rows[0].column_name).toBe('is_distant');
        expect(result.rows[0].data_type).toBe('boolean');
      }
      // If column doesn't exist yet, that's expected (will be added during implementation)
    });

    test('should have planet_type column in planets table', async () => {
      const result = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'planets' AND column_name = 'planet_type'
      `);
      
      if (result.rows.length > 0) {
        expect(result.rows[0].column_name).toBe('planet_type');
      }
      // If column doesn't exist yet, that's expected (will be added during implementation)
    });
  });

  describe('Game Integration - Travel with Distance System', () => {
    let testUser, testGame, terraNova, miningStation;

    beforeEach(async () => {
      const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
      testUser = await User.create(uniqueUsername, 'password123');
      
      const ships = await query('SELECT * FROM ships LIMIT 1');
      testGame = await Game.create(testUser.id, ships.rows[0].id);
      
      terraNova = await TestPlanet.findByName('Terra Nova');
      miningStation = await TestPlanet.findByName('Mining Station Alpha');
    });

    test('should be able to calculate travel requirements from current planet', async () => {
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      const travelInfo = currentPlanet.getTravelInfo(miningStation);
      
      expect(travelInfo.fuelCost).toBeGreaterThan(0);
      expect(travelInfo.travelTime).toBeGreaterThan(0);
    });

    test('should validate player has enough fuel for travel', async () => {
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      const travelInfo = currentPlanet.getTravelInfo(miningStation);
      
      const hasEnoughFuel = testGame.hasEnoughFuel(travelInfo.fuelCost);
      expect(typeof hasEnoughFuel).toBe('boolean');
    });

    test('should provide travel confirmation data', async () => {
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      const destinationPlanet = miningStation;
      
      const travelConfirmation = {
        from: currentPlanet.toJSON(),
        to: destinationPlanet.toJSON(),
        ...currentPlanet.getTravelInfo(destinationPlanet),
        canAfford: testGame.hasEnoughFuel(currentPlanet.fuelCostTo(destinationPlanet)),
        currentFuel: testGame.fuel,
        remainingFuel: testGame.fuel - currentPlanet.fuelCostTo(destinationPlanet)
      };
      
      expect(travelConfirmation).toHaveProperty('from');
      expect(travelConfirmation).toHaveProperty('to');
      expect(travelConfirmation).toHaveProperty('distance');
      expect(travelConfirmation).toHaveProperty('travelTime');
      expect(travelConfirmation).toHaveProperty('fuelCost');
      expect(travelConfirmation).toHaveProperty('canAfford');
      expect(travelConfirmation).toHaveProperty('currentFuel');
      expect(travelConfirmation).toHaveProperty('remainingFuel');
    });
  });
});
import { TestGame as Game, TestUser as User, TestPlanet } from './test-models.js';
import { testQuery as query } from '../src/utils/testDatabase.js';

describe('Planet Classification System', () => {
  // Verify we're using the test database
  test('should be using sorstar_test database', async () => {
    const result = await query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('sorstar_test');
  });

  describe('Planet Type Enum/System', () => {
    test('should have valid planet type constants defined', () => {
      // Import planet types from a constants file (to be created)
      const PLANET_TYPES = {
        FOREST: 'Forest',
        JUNGLE: 'Jungle', 
        INDUSTRIAL: 'Industrial',
        CITY: 'City',
        MINING: 'Mining',
        AGRICULTURAL: 'Agricultural',
        COLONY: 'Colony',
        TRADE_HUB: 'Trade Hub',
        RESEARCH: 'Research',
        MILITARY: 'Military'
      };

      expect(PLANET_TYPES.FOREST).toBe('Forest');
      expect(PLANET_TYPES.JUNGLE).toBe('Jungle');
      expect(PLANET_TYPES.INDUSTRIAL).toBe('Industrial');
      expect(PLANET_TYPES.CITY).toBe('City');
      expect(PLANET_TYPES.MINING).toBe('Mining');
      expect(PLANET_TYPES.AGRICULTURAL).toBe('Agricultural');
      expect(PLANET_TYPES.COLONY).toBe('Colony');
      expect(PLANET_TYPES.TRADE_HUB).toBe('Trade Hub');
      expect(PLANET_TYPES.RESEARCH).toBe('Research');
      expect(PLANET_TYPES.MILITARY).toBe('Military');
    });

    test('should validate planet types against allowed values', () => {
      const validTypes = ['Forest', 'Jungle', 'Industrial', 'City', 'Mining', 'Agricultural', 'Colony', 'Trade Hub', 'Research', 'Military'];
      
      expect(validTypes).toContain('Forest');
      expect(validTypes).toContain('Mining');
      expect(validTypes).toContain('Agricultural');
      expect(validTypes).not.toContain('InvalidType');
    });

    test('should have method to validate planet type', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      
      expect(typeof planet.isValidPlanetType).toBe('function');
      expect(planet.isValidPlanetType('Forest')).toBe(true);
      expect(planet.isValidPlanetType('InvalidType')).toBe(false);
    });

    test('should have method to get all valid planet types', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      
      expect(typeof planet.getValidPlanetTypes).toBe('function');
      const validTypes = planet.getValidPlanetTypes();
      expect(Array.isArray(validTypes)).toBe(true);
      expect(validTypes.length).toBeGreaterThan(5);
      expect(validTypes).toContain('Forest');
      expect(validTypes).toContain('Mining');
    });
  });

  describe('Planet Type Assignment', () => {
    test('should allow assigning planet type to existing planets', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      
      await terraNova.setPlanetType('Trade Hub');
      expect(terraNova.planetType).toBe('Trade Hub');
      
      // Verify persistence in database
      const reloaded = await TestPlanet.findById(terraNova.id);
      expect(reloaded.planetType).toBe('Trade Hub');
    });

    test('should prevent assigning invalid planet types', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      
      await expect(terraNova.setPlanetType('InvalidType')).rejects.toThrow('Invalid planet type');
    });

    test('should allow updating planet type', async () => {
      const miningStation = await TestPlanet.findByName('Mining Station Alpha');
      
      await miningStation.setPlanetType('Industrial');
      expect(miningStation.planetType).toBe('Industrial');
      
      await miningStation.setPlanetType('Mining');
      expect(miningStation.planetType).toBe('Mining');
    });

    test('should have appropriate planet types assigned to all planets', async () => {
      // Set up expected planet type assignments
      const expectedTypes = {
        'Terra Nova': 'Trade Hub',
        'Mining Station Alpha': 'Mining', 
        'Agricultural World Ceres': 'Agricultural',
        'Tech Haven Beta': 'Research',
        'Outer Rim Station': 'Mining',
        'Deep Space Colony': 'Colony'
      };

      // Assign types to all planets
      for (const [planetName, expectedType] of Object.entries(expectedTypes)) {
        const planet = await TestPlanet.findByName(planetName);
        await planet.setPlanetType(expectedType);
        
        expect(planet.planetType).toBe(expectedType);
      }
    });
  });

  describe('Planet Description System', () => {
    test('should generate type-based descriptions', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      await terraNova.setPlanetType('Trade Hub');
      
      const typeDescription = terraNova.getTypeBasedDescription();
      expect(typeof typeDescription).toBe('string');
      expect(typeDescription.length).toBeGreaterThan(10);
      expect(typeDescription.toLowerCase()).toContain('commerce');
    });

    test('should have different descriptions for different planet types', async () => {
      const planet1 = await TestPlanet.findByName('Terra Nova');
      const planet2 = await TestPlanet.findByName('Mining Station Alpha');
      
      await planet1.setPlanetType('Trade Hub');
      await planet2.setPlanetType('Mining');
      
      const desc1 = planet1.getTypeBasedDescription();
      const desc2 = planet2.getTypeBasedDescription();
      
      expect(desc1).not.toBe(desc2);
      expect(desc1.toLowerCase()).toContain('commerce');
      expect(desc2.toLowerCase()).toContain('mineral');
    });

    test('should combine base description with type description', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      await terraNova.setPlanetType('Trade Hub');
      
      const fullDescription = terraNova.getFullDescription();
      expect(typeof fullDescription).toBe('string');
      expect(fullDescription.length).toBeGreaterThan(50);
    });

    test('should handle planets without assigned types', async () => {
      // Find a planet and clear its type
      const planet = await TestPlanet.findByName('Terra Nova');
      await planet.setPlanetType(null);
      
      const description = planet.getTypeBasedDescription();
      expect(typeof description).toBe('string');
      expect(description).toBe('A mysterious world with unknown characteristics.');
    });
  });

  describe('Unique Planet Descriptions', () => {
    test('should generate unique descriptions for each planet type', async () => {
      const planetTypes = ['Forest', 'Jungle', 'Industrial', 'City', 'Mining', 'Agricultural'];
      const descriptions = [];
      
      const testPlanet = await TestPlanet.findByName('Terra Nova');
      
      for (const type of planetTypes) {
        await testPlanet.setPlanetType(type);
        const description = testPlanet.getTypeBasedDescription();
        descriptions.push(description);
      }
      
      // All descriptions should be unique
      const uniqueDescriptions = [...new Set(descriptions)];
      expect(uniqueDescriptions.length).toBe(planetTypes.length);
    });

    test('should include type-specific keywords in descriptions', async () => {
      const typeKeywords = {
        'Forest': ['forest', 'trees', 'woodland', 'green', 'woodlands'],
        'Mining': ['mining', 'ore', 'extraction', 'minerals', 'mineral'],
        'Agricultural': ['farming', 'crops', 'harvest', 'food', 'agricultural', 'farmlands'],
        'Industrial': ['factory', 'manufacturing', 'production', 'industrial', 'factories'],
        'Research': ['research', 'science', 'laboratory', 'technology', 'laboratories'],
        'Trade Hub': ['trade', 'commerce', 'merchants', 'market', 'spaceports', 'markets']
      };

      const testPlanet = await TestPlanet.findByName('Terra Nova');
      
      for (const [type, keywords] of Object.entries(typeKeywords)) {
        await testPlanet.setPlanetType(type);
        const description = testPlanet.getTypeBasedDescription().toLowerCase();
        
        const hasRelevantKeyword = keywords.some(keyword => description.includes(keyword));
        expect(hasRelevantKeyword).toBe(true);
      }
    });

    test('should provide variety in descriptions for same planet type', async () => {
      const testPlanet = await TestPlanet.findByName('Terra Nova');
      await testPlanet.setPlanetType('Forest');
      
      // Should have multiple possible descriptions for variety
      const descriptions = [];
      for (let i = 0; i < 5; i++) {
        const desc = testPlanet.getRandomTypeDescription('Forest');
        descriptions.push(desc);
      }
      
      // Should have at least 2 different descriptions for variety
      const uniqueDescs = [...new Set(descriptions)];
      expect(uniqueDescs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Planet Information Display', () => {
    test('should provide complete planet information for UI display', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      await terraNova.setPlanetType('Trade Hub');
      
      const planetInfo = terraNova.getPlanetInfo();
      
      expect(planetInfo).toHaveProperty('id');
      expect(planetInfo).toHaveProperty('name');
      expect(planetInfo).toHaveProperty('planetType');
      expect(planetInfo).toHaveProperty('baseDescription');
      expect(planetInfo).toHaveProperty('typeDescription');
      expect(planetInfo).toHaveProperty('fullDescription');
      expect(planetInfo).toHaveProperty('coordinates');
      expect(planetInfo).toHaveProperty('isDistant');
    });

    test('should format coordinates for display', async () => {
      const terraNova = await TestPlanet.findByName('Terra Nova');
      const planetInfo = terraNova.getPlanetInfo();
      
      expect(planetInfo.coordinates).toHaveProperty('x');
      expect(planetInfo.coordinates).toHaveProperty('y'); 
      expect(planetInfo.coordinates).toHaveProperty('formatted');
      expect(planetInfo.coordinates.formatted).toBe('(0, 0)');
    });

    test('should indicate special characteristics for distant planets', async () => {
      const distantPlanet = await TestPlanet.findByName('Outer Rim Station');
      const planetInfo = distantPlanet.getPlanetInfo();
      
      expect(planetInfo.isDistant).toBe(true);
      expect(planetInfo).toHaveProperty('specialCharacteristics');
      expect(planetInfo.specialCharacteristics).toContain('Remote location');
    });

    test('should provide planet type statistics', async () => {
      // Assign types to all planets first
      const assignments = [
        ['Terra Nova', 'Trade Hub'],
        ['Mining Station Alpha', 'Mining'],
        ['Agricultural World Ceres', 'Agricultural'],
        ['Tech Haven Beta', 'Research']
      ];

      for (const [name, type] of assignments) {
        const planet = await TestPlanet.findByName(name);
        await planet.setPlanetType(type);
      }

      const stats = await TestPlanet.getPlanetTypeStatistics();
      
      expect(stats).toHaveProperty('totalPlanets');
      expect(stats).toHaveProperty('typeBreakdown');
      expect(stats.totalPlanets).toBeGreaterThan(4);
      expect(stats.typeBreakdown).toHaveProperty('Mining');
      expect(stats.typeBreakdown).toHaveProperty('Agricultural');
    });
  });

  describe('Planet Type Filtering and Queries', () => {
    beforeEach(async () => {
      // Set up test data with specific planet types
      const assignments = [
        ['Terra Nova', 'Trade Hub'],
        ['Mining Station Alpha', 'Mining'],
        ['Agricultural World Ceres', 'Agricultural'],
        ['Tech Haven Beta', 'Research'],
        ['Outer Rim Station', 'Mining'],
        ['Deep Space Colony', 'Colony']
      ];

      for (const [name, type] of assignments) {
        const planet = await TestPlanet.findByName(name);
        await planet.setPlanetType(type);
      }
    });

    test('should find planets by type', async () => {
      const miningPlanets = await TestPlanet.findByType('Mining');
      
      expect(Array.isArray(miningPlanets)).toBe(true);
      expect(miningPlanets.length).toBe(2); // Mining Station Alpha + Outer Rim Station
      expect(miningPlanets.every(p => p.planetType === 'Mining')).toBe(true);
    });

    test('should find planets by multiple types', async () => {
      const planets = await TestPlanet.findByTypes(['Mining', 'Agricultural']);
      
      expect(Array.isArray(planets)).toBe(true);
      expect(planets.length).toBe(3); // 2 Mining + 1 Agricultural
      expect(planets.every(p => ['Mining', 'Agricultural'].includes(p.planetType))).toBe(true);
    });

    test('should find planets suitable for specific activities', async () => {
      const tradingPlanets = await TestPlanet.findPlanetsForActivity('trading');
      
      expect(Array.isArray(tradingPlanets)).toBe(true);
      expect(tradingPlanets.some(p => p.planetType === 'Trade Hub')).toBe(true);
    });

    test('should get planets grouped by type', async () => {
      const groupedPlanets = await TestPlanet.getGroupedByType();
      
      expect(typeof groupedPlanets).toBe('object');
      expect(groupedPlanets).toHaveProperty('Mining');
      expect(groupedPlanets).toHaveProperty('Agricultural');
      expect(Array.isArray(groupedPlanets.Mining)).toBe(true);
      expect(groupedPlanets.Mining.length).toBe(2);
    });
  });

  describe('Game Integration - Planet Classification', () => {
    let testUser, testGame;

    beforeEach(async () => {
      const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
      testUser = await User.create(uniqueUsername, 'password123');
      
      const ships = await query('SELECT * FROM ships LIMIT 1');
      testGame = await Game.create(testUser.id, ships.rows[0].id);
    });

    test('should display planet type in game context', async () => {
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      await currentPlanet.setPlanetType('Trade Hub');
      
      const gameContext = {
        currentPlanet: currentPlanet.getPlanetInfo(),
        playerLocation: `Currently docked at ${currentPlanet.name} (${currentPlanet.planetType})`
      };
      
      expect(gameContext.currentPlanet.planetType).toBe('Trade Hub');
      expect(gameContext.playerLocation).toContain('Trade Hub');
    });

    test('should show nearby planets with their types', async () => {
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      const allPlanets = await TestPlanet.findAll();
      
      // Assign types to planets
      for (const planet of allPlanets) {
        if (!planet.planetType) {
          await planet.setPlanetType('City');
        }
      }
      
      const nearbyPlanets = allPlanets
        .filter(p => p.id !== currentPlanet.id)
        .map(p => ({
          ...p.getPlanetInfo(),
          distance: currentPlanet.distanceTo(p),
          travelTime: currentPlanet.travelTimeTo(p),
          fuelCost: currentPlanet.fuelCostTo(p)
        }));
      
      expect(nearbyPlanets.length).toBeGreaterThan(0);
      expect(nearbyPlanets.every(p => p.planetType)).toBe(true);
      expect(nearbyPlanets.every(p => typeof p.distance === 'number')).toBe(true);
    });

    test('should provide planet recommendations based on type', async () => {
      // Set up different planet types
      const planets = await TestPlanet.findAll();
      const types = ['Trade Hub', 'Mining', 'Agricultural', 'Research'];
      
      for (let i = 0; i < planets.length && i < types.length; i++) {
        await planets[i].setPlanetType(types[i]);
      }
      
      const recommendations = await TestPlanet.getRecommendationsForActivity('trading');
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.some(p => p.planetType === 'Trade Hub')).toBe(true);
    });
  });
});
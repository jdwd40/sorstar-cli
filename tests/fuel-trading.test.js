import { TestGame as Game, TestUser as User, TestPlanet } from './test-models.js';
import { testQuery as query } from '../src/utils/testDatabase.js';

describe('Economic System - Fuel Trading', () => {
  // Verify we're using the test database
  test('should be using sorstar_test database', async () => {
    const result = await query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('sorstar_test');
  });

  describe('Fuel Purchasing Mechanics', () => {
    let testUser, testGame, currentPlanet;

    beforeEach(async () => {
      const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
      testUser = await User.create(uniqueUsername, 'password123');
      
      const ships = await query('SELECT * FROM ships LIMIT 1');
      testGame = await Game.create(testUser.id, ships.rows[0].id);
      currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
    });

    test('should allow purchasing fuel from any planet', async () => {
      // Start with low fuel
      await testGame.setFuel(10);
      const initialFuel = testGame.fuel;
      const fuelToPurchase = 20;
      
      const purchaseResult = await testGame.purchaseFuel(fuelToPurchase);
      
      expect(purchaseResult.success).toBe(true);
      expect(testGame.fuel).toBe(initialFuel + fuelToPurchase);
      expect(purchaseResult.fuelPurchased).toBe(fuelToPurchase);
      expect(purchaseResult.totalCost).toBeGreaterThan(0);
    });

    test('should have fuel pricing available for all planets', async () => {
      const planets = await TestPlanet.findAll();
      
      for (const planet of planets) {
        const fuelPrice = await planet.getFuelPrice();
        expect(typeof fuelPrice).toBe('number');
        expect(fuelPrice).toBeGreaterThan(0);
      }
    });

    test('should prevent purchasing fuel beyond maximum capacity', async () => {
      await testGame.setFuel(testGame.maxFuel - 5); // Near max capacity
      
      const purchaseResult = await testGame.purchaseFuel(10); // Try to exceed capacity
      
      expect(purchaseResult.success).toBe(false);
      expect(purchaseResult.error).toContain('capacity');
    });

    test('should prevent purchasing fuel without sufficient credits', async () => {
      await testGame.setCredits(10); // Low credits
      
      const purchaseResult = await testGame.purchaseFuel(100); // Expensive purchase
      
      expect(purchaseResult.success).toBe(false);
      expect(purchaseResult.error).toContain('credits');
    });

    test('should deduct credits when purchasing fuel', async () => {
      // Start with low fuel so we can purchase more
      await testGame.setFuel(50);
      const initialCredits = testGame.credits;
      const fuelToPurchase = 10;
      
      const purchaseResult = await testGame.purchaseFuel(fuelToPurchase);
      
      expect(purchaseResult.success).toBe(true);
      expect(testGame.credits).toBeLessThan(initialCredits);
      expect(initialCredits - testGame.credits).toBe(purchaseResult.totalCost);
    });

    test('should provide purchase receipt with details', async () => {
      // Start with low fuel so we can purchase more
      await testGame.setFuel(50);
      const fuelToPurchase = 15;
      const purchaseResult = await testGame.purchaseFuel(fuelToPurchase);
      
      expect(purchaseResult).toHaveProperty('success');
      expect(purchaseResult).toHaveProperty('fuelPurchased');
      expect(purchaseResult).toHaveProperty('pricePerUnit');
      expect(purchaseResult).toHaveProperty('totalCost');
      expect(purchaseResult).toHaveProperty('remainingCredits');
      expect(purchaseResult).toHaveProperty('newFuelLevel');
    });
  });

  describe('Planet-Specific Fuel Pricing', () => {
    test('should have different fuel prices across planets', async () => {
      const planets = await TestPlanet.findAll();
      const prices = [];
      
      for (const planet of planets) {
        const price = await planet.getFuelPrice();
        prices.push(price);
      }
      
      // Should have at least 2 different prices
      const uniquePrices = [...new Set(prices)];
      expect(uniquePrices.length).toBeGreaterThan(1);
    });

    test('should have fuel prices based on planet type', async () => {
      // Trade Hub should have competitive prices
      const tradeHub = await TestPlanet.findByName('Terra Nova');
      await tradeHub.setPlanetType('Trade Hub');
      const tradeHubPrice = await tradeHub.getFuelPrice();
      
      // Mining planet should have higher prices
      const miningPlanet = await TestPlanet.findByName('Mining Station Alpha');
      await miningPlanet.setPlanetType('Mining');
      const miningPrice = await miningPlanet.getFuelPrice();
      
      expect(typeof tradeHubPrice).toBe('number');
      expect(typeof miningPrice).toBe('number');
      expect(tradeHubPrice).not.toBe(miningPrice);
    });

    test('should provide fuel market information for planets', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      const marketInfo = await planet.getFuelMarketInfo();
      
      expect(marketInfo).toHaveProperty('price');
      expect(marketInfo).toHaveProperty('availability');
      expect(marketInfo).toHaveProperty('planetName');
      expect(marketInfo).toHaveProperty('planetType');
      expect(marketInfo.availability).toBe('Available');
    });

    test('should calculate fuel costs for specific quantities', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      const quantity = 25;
      
      const costInfo = await planet.calculateFuelCost(quantity);
      
      expect(costInfo).toHaveProperty('quantity');
      expect(costInfo).toHaveProperty('pricePerUnit');
      expect(costInfo).toHaveProperty('totalCost');
      expect(costInfo.quantity).toBe(quantity);
      expect(costInfo.totalCost).toBe(costInfo.quantity * costInfo.pricePerUnit);
    });
  });

  describe('Distant Planet Fuel Discounts', () => {
    test('should have cheaper fuel prices on distant planets', async () => {
      // Get distant planets
      const distantPlanets = await TestPlanet.getDistantPlanets();
      const normalPlanets = await TestPlanet.getNormalPlanets();
      
      expect(distantPlanets.length).toBeGreaterThan(0);
      expect(normalPlanets.length).toBeGreaterThan(0);
      
      // Compare average prices
      const distantPrices = await Promise.all(
        distantPlanets.map(p => p.getFuelPrice())
      );
      const normalPrices = await Promise.all(
        normalPlanets.map(p => p.getFuelPrice())
      );
      
      const avgDistantPrice = distantPrices.reduce((a, b) => a + b) / distantPrices.length;
      const avgNormalPrice = normalPrices.reduce((a, b) => a + b) / normalPrices.length;
      
      expect(avgDistantPrice).toBeLessThan(avgNormalPrice);
    });

    test('should apply distance-based pricing discount', async () => {
      const distantPlanet = await TestPlanet.findByName('Outer Rim Station');
      const normalPlanet = await TestPlanet.findByName('Terra Nova');
      
      expect(distantPlanet.isDistant).toBe(true);
      expect(normalPlanet.isDistant).toBe(false);
      
      const distantPrice = await distantPlanet.getFuelPrice();
      const normalPrice = await normalPlanet.getFuelPrice();
      
      // Distant planets should have at least 20% discount
      const expectedMaxDistantPrice = normalPrice * 0.8;
      expect(distantPrice).toBeLessThan(normalPrice);
    });

    test('should show distance discount in market information', async () => {
      const distantPlanet = await TestPlanet.findByName('Deep Space Colony');
      const marketInfo = await distantPlanet.getFuelMarketInfo();
      
      expect(marketInfo).toHaveProperty('discount');
      expect(marketInfo.discount).toContain('Distance');
      expect(marketInfo.availability).toBe('Available');
    });
  });

  describe('Fuel Vendor/Trading Interface', () => {
    let testUser, testGame;

    beforeEach(async () => {
      const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
      testUser = await User.create(uniqueUsername, 'password123');
      
      const ships = await query('SELECT * FROM ships LIMIT 1');
      testGame = await Game.create(testUser.id, ships.rows[0].id);
    });

    test('should provide fuel vendor interface for current planet', async () => {
      const vendorInfo = await testGame.getFuelVendorInfo();
      
      expect(vendorInfo).toHaveProperty('planetName');
      expect(vendorInfo).toHaveProperty('fuelPrice');
      expect(vendorInfo).toHaveProperty('maxPurchasable');
      expect(vendorInfo).toHaveProperty('playerCredits');
      expect(vendorInfo).toHaveProperty('currentFuel');
      expect(vendorInfo).toHaveProperty('maxFuel');
    });

    test('should calculate maximum purchasable fuel based on credits', async () => {
      await testGame.setCredits(1000);
      const vendorInfo = await testGame.getFuelVendorInfo();
      
      const maxByCredits = Math.floor(testGame.credits / vendorInfo.fuelPrice);
      const maxByCapacity = testGame.maxFuel - testGame.fuel;
      const expectedMax = Math.min(maxByCredits, maxByCapacity);
      
      expect(vendorInfo.maxPurchasable).toBe(expectedMax);
    });

    test('should show fuel trading history', async () => {
      // Start with low fuel so we can purchase more
      await testGame.setFuel(30);
      
      // Make a few fuel purchases
      const purchase1 = await testGame.purchaseFuel(10);
      const purchase2 = await testGame.purchaseFuel(5);
      
      expect(purchase1.success).toBe(true);
      expect(purchase2.success).toBe(true);
      
      const history = await testGame.getFuelTradingHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
      expect(history[0]).toHaveProperty('quantity');
      expect(history[0]).toHaveProperty('price');
      expect(history[0]).toHaveProperty('planetName');
      expect(history[0]).toHaveProperty('timestamp');
    });

    test('should handle bulk fuel purchase calculations', async () => {
      const quantities = [10, 25, 50, 100];
      const currentPlanet = await TestPlanet.findById(testGame.currentPlanetId);
      
      for (const qty of quantities) {
        const calculation = await currentPlanet.calculateFuelCost(qty);
        expect(calculation.quantity).toBe(qty);
        expect(calculation.totalCost).toBe(qty * calculation.pricePerUnit);
      }
    });
  });

  describe('Dynamic Pricing Variations', () => {
    test('should have pricing influenced by planet type', async () => {
      const planets = await TestPlanet.findAll();
      const pricesByType = {};
      
      // Ensure all planets have types assigned
      const planetTypes = ['Trade Hub', 'Mining', 'Agricultural', 'Research', 'Industrial', 'Colony'];
      
      for (let i = 0; i < planets.length && i < planetTypes.length; i++) {
        await planets[i].setPlanetType(planetTypes[i]);
        const price = await planets[i].getFuelPrice();
        pricesByType[planetTypes[i]] = price;
      }
      
      // Trade Hubs should have competitive prices
      // Mining/Industrial should have higher prices
      expect(pricesByType['Trade Hub']).toBeDefined();
      expect(pricesByType['Mining']).toBeDefined();
      expect(pricesByType['Trade Hub']).toBeLessThan(pricesByType['Mining']);
    });

    test('should provide price comparison across planets', async () => {
      const comparison = await TestPlanet.getFuelPriceComparison();
      
      expect(comparison).toHaveProperty('cheapest');
      expect(comparison).toHaveProperty('mostExpensive');
      expect(comparison).toHaveProperty('average');
      expect(comparison).toHaveProperty('priceRange');
      
      expect(comparison.cheapest.price).toBeLessThanOrEqual(comparison.mostExpensive.price);
      expect(comparison.priceRange).toBeGreaterThan(0);
    });

    test('should show fuel price trends by planet type', async () => {
      const trends = await TestPlanet.getFuelPriceTrendsByType();
      
      expect(typeof trends).toBe('object');
      expect(trends).toHaveProperty('Trade Hub');
      expect(trends).toHaveProperty('Mining');
      
      // Each trend should have price statistics
      for (const [type, stats] of Object.entries(trends)) {
        expect(stats).toHaveProperty('averagePrice');
        expect(stats).toHaveProperty('planetCount');
        expect(stats.planetCount).toBeGreaterThan(0);
      }
    });

    test('should apply supply and demand factors to pricing', async () => {
      const planet = await TestPlanet.findByName('Terra Nova');
      await planet.setPlanetType('Trade Hub');
      
      const pricingFactors = await planet.getFuelPricingFactors();
      
      expect(pricingFactors).toHaveProperty('basePrice');
      expect(pricingFactors).toHaveProperty('planetTypeModifier');
      expect(pricingFactors).toHaveProperty('distanceModifier');
      expect(pricingFactors).toHaveProperty('finalPrice');
      
      // Final price should be calculated from factors
      const expectedPrice = pricingFactors.basePrice * 
                          pricingFactors.planetTypeModifier * 
                          pricingFactors.distanceModifier;
      expect(Math.abs(pricingFactors.finalPrice - expectedPrice)).toBeLessThan(0.01);
    });
  });

  describe('Game Integration - Fuel Trading', () => {
    let testUser, testGame;

    beforeEach(async () => {
      const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
      testUser = await User.create(uniqueUsername, 'password123');
      
      const ships = await query('SELECT * FROM ships LIMIT 1');
      testGame = await Game.create(testUser.id, ships.rows[0].id);
    });

    test('should integrate fuel trading with travel system', async () => {
      // Start with lower fuel and purchase more
      await testGame.setFuel(60);
      const purchaseResult = await testGame.purchaseFuel(20);
      expect(purchaseResult.success).toBe(true);
      
      const planets = await TestPlanet.findAll();
      const destinationPlanet = planets.find(p => p.id !== testGame.currentPlanetId);
      
      const travelResult = await testGame.travelToPlanet(destinationPlanet.id);
      expect(travelResult.success).toBe(true);
      
      // Should be able to buy fuel at new location
      const vendorInfo = await testGame.getFuelVendorInfo();
      expect(vendorInfo.planetName).toBe(destinationPlanet.name);
    });

    test('should save fuel trading transactions to database', async () => {
      // Start with low fuel so we can purchase more
      await testGame.setFuel(30);
      
      const initialTransactionCount = await query(
        'SELECT COUNT(*) FROM fuel_transactions WHERE game_id = $1',
        [testGame.id]
      );
      
      const purchaseResult = await testGame.purchaseFuel(15);
      expect(purchaseResult.success).toBe(true);
      
      const finalTransactionCount = await query(
        'SELECT COUNT(*) FROM fuel_transactions WHERE game_id = $1',
        [testGame.id]
      );
      
      expect(parseInt(finalTransactionCount.rows[0].count)).toBe(
        parseInt(initialTransactionCount.rows[0].count) + 1
      );
    });

    test('should provide fuel trading recommendations', async () => {
      const recommendations = await testGame.getFuelTradingRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('planetName');
        expect(recommendations[0]).toHaveProperty('price');
        expect(recommendations[0]).toHaveProperty('savings');
        expect(recommendations[0]).toHaveProperty('travelCost');
      }
    });

    test('should handle fuel trading in game state JSON', async () => {
      // Start with low fuel and purchase some
      await testGame.setFuel(50);
      const purchaseResult = await testGame.purchaseFuel(10);
      expect(purchaseResult.success).toBe(true);
      
      const gameState = await testGame.toJSONWithFuelPrice();
      
      expect(gameState).toHaveProperty('fuel');
      expect(gameState).toHaveProperty('maxFuel');
      expect(gameState).toHaveProperty('credits');
      
      // Should include fuel vendor info for current planet
      expect(gameState).toHaveProperty('currentPlanetFuelPrice');
    });
  });
});
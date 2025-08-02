import { TestGame as Game, TestUser as User } from './test-models.js';
import { testQuery as query } from '../src/utils/testDatabase.js';

describe('Fuel System - Data Structure & State', () => {
  let testUser;
  let testGame;

  // Verify we're using the test database
  test('should be using sorstar_test database', async () => {
    const result = await query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('sorstar_test');
  });

  beforeEach(async () => {
    // Create test user with unique username
    const uniqueUsername = `testuser_${Date.now()}_${Math.random()}`;
    testUser = await User.create(uniqueUsername, 'password123');
    
    // Create test game
    const ships = await query('SELECT * FROM ships LIMIT 1');
    testGame = await Game.create(testUser.id, ships.rows[0].id);
  });

  describe('Game Model Fuel Properties', () => {
    test('should have fuel property in game instance', () => {
      expect(testGame).toHaveProperty('fuel');
      expect(typeof testGame.fuel).toBe('number');
    });

    test('should have maxFuel property in game instance', () => {
      expect(testGame).toHaveProperty('maxFuel');
      expect(typeof testGame.maxFuel).toBe('number');
    });

    test('should initialize with default fuel values', () => {
      expect(testGame.fuel).toBe(100); // Default starting fuel
      expect(testGame.maxFuel).toBe(100); // Default max fuel capacity
    });

    test('should not allow fuel to exceed maxFuel', () => {
      expect(testGame.fuel).toBeLessThanOrEqual(testGame.maxFuel);
    });
  });

  describe('Database Persistence - Fuel Properties', () => {
    test('should save fuel property to database', async () => {
      const result = await query('SELECT fuel FROM games WHERE id = $1', [testGame.id]);
      expect(result.rows[0].fuel).toBe(100);
    });

    test('should save maxFuel property to database', async () => {
      const result = await query('SELECT max_fuel FROM games WHERE id = $1', [testGame.id]);
      expect(result.rows[0].max_fuel).toBe(100);
    });

    test('should load fuel properties from database', async () => {
      // Update fuel in database directly
      await query('UPDATE games SET fuel = $1, max_fuel = $2 WHERE id = $3', [75, 120, testGame.id]);
      
      // Reload game from database
      const reloadedGame = await Game.findById(testGame.id);
      expect(reloadedGame.fuel).toBe(75);
      expect(reloadedGame.maxFuel).toBe(120);
    });
  });

  describe('Turn Tracking System', () => {
    test('should track current turn in game state', () => {
      expect(testGame).toHaveProperty('currentTurn');
      expect(typeof testGame.currentTurn).toBe('number');
      expect(testGame.currentTurn).toBe(0); // Should start at turn 0
    });

    test('should persist currentTurn to database', async () => {
      const result = await query('SELECT current_turn FROM games WHERE id = $1', [testGame.id]);
      expect(result.rows[0].current_turn).toBe(0);
    });

    test('should load currentTurn from database', async () => {
      // Update turn in database directly  
      await query('UPDATE games SET current_turn = $1 WHERE id = $2', [5, testGame.id]);
      
      // Reload game from database
      const reloadedGame = await Game.findById(testGame.id);
      expect(reloadedGame.currentTurn).toBe(5);
    });

    test('should increment currentTurn when advancing game state', async () => {
      const originalTurn = testGame.currentTurn;
      await testGame.advanceTurn();
      expect(testGame.currentTurn).toBe(originalTurn + 1);
    });
  });

  describe('Fuel Management Methods', () => {
    test('should have consumeFuel method', () => {
      expect(typeof testGame.consumeFuel).toBe('function');
    });

    test('should reduce fuel when consumeFuel is called', async () => {
      const originalFuel = testGame.fuel;
      await testGame.consumeFuel(25);
      expect(testGame.fuel).toBe(originalFuel - 25);
    });

    test('should have addFuel method', () => {
      expect(typeof testGame.addFuel).toBe('function');
    });

    test('should increase fuel when addFuel is called', async () => {
      // First consume some fuel
      await testGame.consumeFuel(30);
      const currentFuel = testGame.fuel;
      
      await testGame.addFuel(20);
      expect(testGame.fuel).toBe(currentFuel + 20);
    });

    test('should not allow fuel to exceed maxFuel when adding', async () => {
      await testGame.addFuel(50); // This would exceed maxFuel
      expect(testGame.fuel).toBe(testGame.maxFuel);
    });

    test('should not allow fuel to go below 0 when consuming', async () => {
      await testGame.consumeFuel(150); // This would go below 0
      expect(testGame.fuel).toBe(0);
    });

    test('should have hasEnoughFuel method', () => {
      expect(typeof testGame.hasEnoughFuel).toBe('function');
    });

    test('should return true when has enough fuel', () => {
      expect(testGame.hasEnoughFuel(50)).toBe(true);
    });

    test('should return false when does not have enough fuel', () => {
      expect(testGame.hasEnoughFuel(150)).toBe(false);
    });
  });

  describe('JSON Serialization with Fuel Data', () => {
    test('should include fuel in toJSON output', () => {
      const json = testGame.toJSON();
      expect(json).toHaveProperty('fuel');
      expect(json.fuel).toBe(testGame.fuel);
    });

    test('should include maxFuel in toJSON output', () => {
      const json = testGame.toJSON();
      expect(json).toHaveProperty('maxFuel');
      expect(json.maxFuel).toBe(testGame.maxFuel);
    });

    test('should include currentTurn in toJSON output', () => {
      const json = testGame.toJSON();
      expect(json).toHaveProperty('currentTurn');
      expect(json.currentTurn).toBe(testGame.currentTurn);
    });
  });

  describe('Database Transaction Consistency', () => {
    test('should save fuel changes with turn advancement in single transaction', async () => {
      const originalFuel = testGame.fuel;
      const originalTurn = testGame.currentTurn;
      
      await testGame.consumeFuelAndAdvanceTurn(30);
      
      // Check both properties changed
      expect(testGame.fuel).toBe(originalFuel - 30);
      expect(testGame.currentTurn).toBe(originalTurn + 1);
      
      // Verify in database
      const result = await query('SELECT fuel, current_turn FROM games WHERE id = $1', [testGame.id]);
      expect(result.rows[0].fuel).toBe(originalFuel - 30);
      expect(result.rows[0].current_turn).toBe(originalTurn + 1);
    });
  });
});
// Enhanced Travel System API Tests
/**
 * @jest-environment node
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from '../web/js/api.js';

// Mock fetch globally - this is a frontend test, no database needed
global.fetch = jest.fn();

describe('ApiClient - Enhanced Travel System Methods', () => {
  let apiClient;
  const mockToken = 'test-jwt-token';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    apiClient = new ApiClient(baseUrl);
    apiClient.setAuthToken(mockToken);
    fetch.mockClear();
  });

  describe('getPlanetDetails(planetId)', () => {
    test('should make GET request to /planets/:id/details endpoint', async () => {
      // Arrange
      const planetId = 1;
      const mockPlanetDetails = {
        id: 1,
        name: 'Terra Nova',
        type: 'Forest',
        description: 'A lush forest world with abundant natural resources and diverse ecosystems.',
        distance: 0, // Current planet
        distanceFromPlayer: 0,
        classification: 'habitable',
        atmosphere: 'breathable',
        temperature: 'temperate',
        specialFeatures: ['Ancient forests', 'Crystal caves', 'Wildlife preserves'],
        fuelPrice: 8,
        commoditySpecialties: ['Wood', 'Medicinal Herbs', 'Exotic Animals']
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlanetDetails
      });

      // Act
      const result = await apiClient.getPlanetDetails(planetId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/planets/${planetId}/details`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockPlanetDetails);
    });

    test('should handle different planet types correctly', async () => {
      // Test Industrial planet
      const planetId = 2;
      const mockIndustrialPlanet = {
        id: 2,
        name: 'Steel Harbor',
        type: 'Industrial',
        description: 'A heavily industrialized world with massive factories and mining operations.',
        distance: 6,
        distanceFromPlayer: 6,
        classification: 'industrial',
        atmosphere: 'polluted',
        temperature: 'hot',
        specialFeatures: ['Mega factories', 'Mining complexes', 'Trade hubs'],
        fuelPrice: 12,
        commoditySpecialties: ['Metals', 'Machinery', 'Electronics']
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIndustrialPlanet
      });

      const result = await apiClient.getPlanetDetails(planetId);
      
      expect(result.type).toBe('Industrial');
      expect(result.fuelPrice).toBeGreaterThan(0);
      expect(result.commoditySpecialties).toContain('Metals');
    });

    test('should validate planetId parameter', async () => {
      // Test missing planetId
      await expect(apiClient.getPlanetDetails(undefined))
        .rejects.toThrow('Planet ID is required');

      // Test invalid planetId type
      await expect(apiClient.getPlanetDetails('invalid'))
        .rejects.toThrow('Planet ID must be a number');
    });

    test('should handle planet not found error', async () => {
      const invalidPlanetId = 999;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Planet not found' })
      });

      await expect(apiClient.getPlanetDetails(invalidPlanetId))
        .rejects.toThrow('Planet not found');
    });
  });

  describe('getPlanetDistanceInfo(planetId)', () => {
    test('should make GET request to /planets/:id/distance endpoint', async () => {
      // Arrange
      const planetId = 3;
      const mockDistanceInfo = {
        planetId: 3,
        planetName: 'Jungle Prime',
        currentPlayerPlanet: 1,
        distance: 6,
        travelTime: 6,
        fuelRequired: 5,
        travelCost: 50,
        canReach: true,
        isDistantPlanet: false,
        routeInfo: {
          directRoute: true,
          waypoints: [],
          totalDistance: 6
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistanceInfo
      });

      // Act
      const result = await apiClient.getPlanetDistanceInfo(planetId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/planets/${planetId}/distance`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockDistanceInfo);
    });

    test('should handle distant planet information', async () => {
      const distantPlanetId = 7;
      const mockDistantPlanetInfo = {
        planetId: 7,
        planetName: 'Outer Rim Mining Station',
        currentPlayerPlanet: 1,
        distance: 10,
        travelTime: 10,
        fuelRequired: 8,
        travelCost: 80,
        canReach: true,
        isDistantPlanet: true,
        routeInfo: {
          directRoute: true,
          waypoints: [],
          totalDistance: 10
        },
        warning: 'This is a distant planet with higher travel costs'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistantPlanetInfo
      });

      const result = await apiClient.getPlanetDistanceInfo(distantPlanetId);
      
      expect(result.isDistantPlanet).toBe(true);
      expect(result.distance).toBe(10);
      expect(result.warning).toContain('distant planet');
    });

    test('should handle insufficient fuel scenario', async () => {
      const farPlanetId = 5;
      const mockInsufficientFuelInfo = {
        planetId: 5,
        planetName: 'Remote Outpost',
        currentPlayerPlanet: 1,
        distance: 8,
        travelTime: 8,
        fuelRequired: 7,
        travelCost: 70,
        canReach: false,
        isDistantPlanet: false,
        routeInfo: {
          directRoute: true,
          waypoints: [],
          totalDistance: 8
        },
        warning: 'Insufficient fuel to reach this destination'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsufficientFuelInfo
      });

      const result = await apiClient.getPlanetDistanceInfo(farPlanetId);
      
      expect(result.canReach).toBe(false);
      expect(result.warning).toContain('Insufficient fuel');
    });

    test('should validate planetId parameter', async () => {
      await expect(apiClient.getPlanetDistanceInfo(undefined))
        .rejects.toThrow('Planet ID is required');

      await expect(apiClient.getPlanetDistanceInfo('invalid'))
        .rejects.toThrow('Planet ID must be a number');
    });
  });

  describe('Enhanced travel() method', () => {
    test('should include fuel consumption in travel response', async () => {
      // Arrange
      const planetId = 2;
      const mockEnhancedTravelResponse = {
        message: 'Traveled to Steel Harbor',
        success: true,
        previousPlanet: {
          id: 1,
          name: 'Terra Nova'
        },
        newPlanet: {
          id: 2,
          name: 'Steel Harbor',
          type: 'Industrial'
        },
        travelDetails: {
          distance: 6,
          timeElapsed: 6,
          fuelConsumed: 5,
          fuelRemaining: 20
        },
        gameState: {
          id: 1,
          currentPlanet: 2,
          fuel: 20,
          maxFuel: 100,
          credits: 1000,
          gameTurn: 7
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedTravelResponse
      });

      // Act
      const result = await apiClient.travel(planetId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/game/travel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({ planetId })
      });
      expect(result.travelDetails).toBeDefined();
      expect(result.travelDetails.fuelConsumed).toBeGreaterThan(0);
      expect(result.travelDetails.timeElapsed).toBeGreaterThan(0);
    });

    test('should handle insufficient fuel error', async () => {
      const distantPlanetId = 8;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Insufficient fuel for travel' })
      });

      await expect(apiClient.travel(distantPlanetId))
        .rejects.toThrow('Insufficient fuel for travel');
    });

    test('should handle travel to same planet', async () => {
      const currentPlanetId = 1;
      const mockSamePlanetResponse = {
        message: 'Already at Terra Nova',
        success: false,
        warning: 'Cannot travel to current planet',
        gameState: {
          id: 1,
          currentPlanet: 1,
          fuel: 25,
          maxFuel: 100
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSamePlanetResponse
      });

      const result = await apiClient.travel(currentPlanetId);
      
      expect(result.success).toBe(false);
      expect(result.warning).toContain('current planet');
    });
  });

  describe('Enhanced getPlanets() method', () => {
    test('should return planets with distance and type information', async () => {
      // Arrange
      const mockEnhancedPlanets = [
        {
          id: 1,
          name: 'Terra Nova',
          type: 'Forest',
          description: 'A lush forest world',
          distanceFromPlayer: 0,
          travelTime: 0,
          fuelRequired: 0,
          canReach: true,
          isCurrentPlanet: true,
          fuelPrice: 8
        },
        {
          id: 2,
          name: 'Steel Harbor',
          type: 'Industrial',
          description: 'A heavily industrialized world',
          distanceFromPlayer: 6,
          travelTime: 6,
          fuelRequired: 5,
          canReach: true,
          isCurrentPlanet: false,
          fuelPrice: 12
        },
        {
          id: 3,
          name: 'Jungle Prime',
          type: 'Jungle',
          description: 'Dense tropical jungle planet',
          distanceFromPlayer: 6,
          travelTime: 6,
          fuelRequired: 5,
          canReach: true,
          isCurrentPlanet: false,
          fuelPrice: 7
        },
        {
          id: 7,
          name: 'Outer Rim Station',
          type: 'City',
          description: 'Distant trading outpost',
          distanceFromPlayer: 10,
          travelTime: 10,
          fuelRequired: 8,
          canReach: false,
          isCurrentPlanet: false,
          isDistantPlanet: true,
          fuelPrice: 5
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedPlanets
      });

      // Act
      const result = await apiClient.getPlanets();

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/planets`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      expect(result).toHaveLength(4);
      expect(result[0].type).toBeDefined();
      expect(result[0].distanceFromPlayer).toBeDefined();
      expect(result[0].canReach).toBeDefined();
      
      // Check current planet
      const currentPlanet = result.find(p => p.isCurrentPlanet);
      expect(currentPlanet).toBeDefined();
      expect(currentPlanet.distanceFromPlayer).toBe(0);
      
      // Check distant planet
      const distantPlanet = result.find(p => p.isDistantPlanet);
      expect(distantPlanet).toBeDefined();
      expect(distantPlanet.distanceFromPlayer).toBe(10);
    });

    test('should handle player without current game state', async () => {
      // When player hasn't started a game yet
      const mockBasicPlanets = [
        {
          id: 1,
          name: 'Terra Nova',
          type: 'Forest',
          description: 'A lush forest world',
          fuelPrice: 8
        },
        {
          id: 2,
          name: 'Steel Harbor',
          type: 'Industrial',
          description: 'A heavily industrialized world',
          fuelPrice: 12
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBasicPlanets
      });

      const result = await apiClient.getPlanets();
      
      expect(result).toHaveLength(2);
      // Without active game, distance info might not be available
      expect(result[0].type).toBeDefined();
      expect(result[0].fuelPrice).toBeDefined();
    });
  });

  describe('Network error handling', () => {
    test('should handle network failures for planet details', async () => {
      fetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(apiClient.getPlanetDetails(1))
        .rejects.toThrow('Network request failed');
    });

    test('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(apiClient.getPlanetDistanceInfo(1))
        .rejects.toThrow('Invalid JSON');
    });

    test('should handle server errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' })
      });

      await expect(apiClient.getPlanetDetails(1))
        .rejects.toThrow('Database connection failed');
    });
  });
});
// Enhanced Game State API Tests
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from '../web/js/api.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient - Enhanced Game State Methods', () => {
  let apiClient;
  const mockToken = 'test-jwt-token';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    apiClient = new ApiClient(baseUrl);
    apiClient.setAuthToken(mockToken);
    fetch.mockClear();
  });

  describe('Enhanced getGameState()', () => {
    test('should return game state with comprehensive fuel information', async () => {
      // Arrange
      const mockEnhancedGameState = {
        id: 1,
        playerId: 123,
        username: 'testpilot',
        credits: 1500,
        currentPlanet: {
          id: 2,
          name: 'Steel Harbor',
          type: 'Industrial',
          description: 'A heavily industrialized world with massive factories',
          distance: 0, // Current planet
          fuelPrice: 12
        },
        ship: {
          id: 1,
          name: 'Light Freighter',
          cargoCapacity: 50,
          cargoUsed: 15
        },
        // Enhanced fuel information
        fuel: {
          current: 75,
          maximum: 100,
          percentage: 75,
          status: 'adequate', // 'critical', 'low', 'adequate', 'full'
          range: {
            estimatedDistance: 12,
            reachablePlanets: [1, 3, 4, 5, 6],
            unreachablePlanets: [7, 8]
          },
          efficiency: {
            averageConsumption: 0.8,
            lastTripConsumption: 6,
            fuelPerUnit: 1.2
          }
        },
        // Enhanced location information
        location: {
          currentPlanetId: 2,
          currentPlanetName: 'Steel Harbor',
          currentPlanetType: 'Industrial',
          nearbyPlanets: [
            {
              id: 1,
              name: 'Terra Nova',
              type: 'Forest',
              distance: 6,
              travelTime: 6,
              canReach: true,
              fuelRequired: 5
            },
            {
              id: 3,
              name: 'Jungle Prime',
              type: 'Jungle', 
              distance: 6,
              travelTime: 6,
              canReach: true,
              fuelRequired: 5
            }
          ]
        },
        // Game progression
        gameStats: {
          gameTurn: 15,
          totalDistance: 42,
          planetsVisited: 3,
          totalTrades: 8,
          fuelPurchased: 50,
          netProfit: 750
        },
        // Current market context
        currentMarket: {
          planetId: 2,
          fuelPrice: 12,
          commoditiesAvailable: 6,
          specialties: ['Metals', 'Electronics', 'Machinery']
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedGameState
      });

      // Act
      const result = await apiClient.getGameState();

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/game/state`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });

      expect(result).toEqual(mockEnhancedGameState);

      // Verify enhanced fuel information structure
      expect(result.fuel).toBeDefined();
      expect(result.fuel.current).toBe(75);
      expect(result.fuel.maximum).toBe(100);
      expect(result.fuel.percentage).toBe(75);
      expect(result.fuel.status).toBe('adequate');
      expect(result.fuel.range).toBeDefined();
      expect(result.fuel.efficiency).toBeDefined();

      // Verify enhanced location information
      expect(result.location).toBeDefined();
      expect(result.location.nearbyPlanets).toHaveLength(2);
      expect(result.currentPlanet.type).toBe('Industrial');
    });

    test('should handle critical fuel level game state', async () => {
      const mockCriticalFuelState = {
        id: 1,
        playerId: 123,
        credits: 2000,
        currentPlanet: {
          id: 5,
          name: 'Remote Outpost',
          type: 'Desert',
          fuelPrice: 15
        },
        fuel: {
          current: 8,
          maximum: 100,
          percentage: 8,
          status: 'critical',
          range: {
            estimatedDistance: 1,
            reachablePlanets: [4], // Only nearby planet
            unreachablePlanets: [1, 2, 3, 6, 7, 8]
          },
          warnings: [
            'Critical fuel level - immediate refueling recommended',
            'Limited travel options available'
          ]
        },
        location: {
          currentPlanetId: 5,
          nearbyPlanets: [
            {
              id: 4,
              name: 'Mining Station Alpha',
              distance: 2,
              canReach: false, // Not enough fuel
              fuelRequired: 10
            }
          ]
        },
        gameStats: {
          gameTurn: 25,
          fuelEmergencies: 1
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCriticalFuelState
      });

      const result = await apiClient.getGameState();
      
      expect(result.fuel.status).toBe('critical');
      expect(result.fuel.percentage).toBe(8);
      expect(result.fuel.warnings).toContain('Critical fuel level - immediate refueling recommended');
      expect(result.fuel.range.reachablePlanets).toHaveLength(1);
    });

    test('should handle full fuel game state', async () => {
      const mockFullFuelState = {
        id: 1,
        fuel: {
          current: 100,
          maximum: 100,
          percentage: 100,
          status: 'full',
          range: {
            estimatedDistance: 20,
            reachablePlanets: [1, 2, 3, 4, 5, 6, 7, 8],
            unreachablePlanets: []
          }
        },
        location: {
          currentPlanetId: 1,
          nearbyPlanets: [
            {
              id: 7,
              name: 'Distant Mining Station',
              distance: 10,
              canReach: true,
              fuelRequired: 8,
              isDistantPlanet: true
            }
          ]
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFullFuelState
      });

      const result = await apiClient.getGameState();
      
      expect(result.fuel.status).toBe('full');
      expect(result.fuel.percentage).toBe(100);
      expect(result.fuel.range.unreachablePlanets).toHaveLength(0);
      expect(result.location.nearbyPlanets[0].canReach).toBe(true);
    });

    test('should handle new player game state', async () => {
      const mockNewPlayerState = {
        id: 1,
        credits: 5000,
        currentPlanet: {
          id: 1,
          name: 'Terra Nova',
          type: 'Forest',
          description: 'Starting world with lush forests'
        },
        fuel: {
          current: 100,
          maximum: 100,
          percentage: 100,
          status: 'full',
          range: {
            estimatedDistance: 20,
            reachablePlanets: [2, 3, 4, 5, 6],
            unreachablePlanets: [7, 8] // Distant planets
          }
        },
        gameStats: {
          gameTurn: 1,
          totalDistance: 0,
          planetsVisited: 1,
          totalTrades: 0,
          isNewPlayer: true
        },
        tutorial: {
          completed: false,
          nextStep: 'explore_planets',
          hints: ['Visit nearby planets to start trading', 'Monitor your fuel levels']
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewPlayerState
      });

      const result = await apiClient.getGameState();
      
      expect(result.gameStats.isNewPlayer).toBe(true);
      expect(result.gameStats.gameTurn).toBe(1);
      expect(result.tutorial).toBeDefined();
      expect(result.tutorial.nextStep).toBe('explore_planets');
    });

    test('should handle game state with planet specializations', async () => {
      const mockSpecializedPlanetState = {
        id: 1,
        currentPlanet: {
          id: 3,
          name: 'Jungle Prime',
          type: 'Jungle',
          specializations: ['Medicinal Herbs', 'Exotic Animals', 'Rare Woods'],
          economicModifiers: {
            foodPrices: -0.15,
            medicinePrices: -0.3,
            luxuryPrices: 0.2
          }
        },
        fuel: {
          current: 60,
          maximum: 100,
          status: 'adequate'
        },
        currentMarket: {
          planetId: 3,
          planetType: 'Jungle',
          fuelPrice: 7, // Cheaper on distant planets
          commodityBonuses: [
            {
              commodity: 'Medicinal Herbs',
              priceModifier: -0.3,
              availability: 'abundant'
            }
          ]
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpecializedPlanetState
      });

      const result = await apiClient.getGameState();
      
      expect(result.currentPlanet.specializations).toContain('Medicinal Herbs');
      expect(result.currentPlanet.economicModifiers.foodPrices).toBe(-0.15);
      expect(result.currentMarket.commodityBonuses).toHaveLength(1);
    });

    test('should validate authentication requirement', async () => {
      const unauthenticatedClient = new ApiClient(baseUrl);
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Access token required' })
      });

      await expect(unauthenticatedClient.getGameState())
        .rejects.toThrow('Access token required');
    });

    test('should handle no active game state', async () => {
      const mockNoGameState = {
        hasActiveGame: false,
        playerId: 123,
        username: 'testpilot',
        message: 'No active game found. Start a new game to begin playing.',
        availableShips: [
          {
            id: 1,
            name: 'Light Freighter',
            cost: 5000,
            cargoCapacity: 50
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNoGameState
      });

      const result = await apiClient.getGameState();
      
      expect(result.hasActiveGame).toBe(false);
      expect(result.message).toContain('No active game found');
      expect(result.availableShips).toHaveLength(1);
    });

    test('should handle server errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' })
      });

      await expect(apiClient.getGameState())
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Network error handling', () => {
    test('should handle network failures', async () => {
      fetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(apiClient.getGameState())
        .rejects.toThrow('Network request failed');
    });

    test('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(apiClient.getGameState())
        .rejects.toThrow('Invalid JSON');
    });

    test('should handle timeout scenarios', async () => {
      fetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiClient.getGameState())
        .rejects.toThrow('Request timeout');
    });
  });
});
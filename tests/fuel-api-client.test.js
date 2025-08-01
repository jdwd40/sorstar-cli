// Frontend API Client Tests - Fuel System
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from '../web/js/api.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient - Fuel System Methods', () => {
  let apiClient;
  const mockToken = 'test-jwt-token';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    apiClient = new ApiClient(baseUrl);
    apiClient.setAuthToken(mockToken);
    fetch.mockClear();
  });

  describe('getFuelInfo()', () => {
    test('should make GET request to /game/fuel endpoint', async () => {
      // Arrange
      const mockFuelData = {
        currentFuel: 75,
        maxFuel: 100,
        fuelPercentage: 75,
        fuelStatus: 'adequate',
        rangeEstimate: 12
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFuelData
      });

      // Act
      const result = await apiClient.getFuelInfo();

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/game/fuel`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockFuelData);
    });

    test('should throw error when not authenticated', async () => {
      // Arrange
      const unauthenticatedClient = new ApiClient(baseUrl);
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Access token required' })
      });

      // Act & Assert
      await expect(unauthenticatedClient.getFuelInfo()).rejects.toThrow('Access token required');
    });

    test('should handle server errors gracefully', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' })
      });

      // Act & Assert
      await expect(apiClient.getFuelInfo()).rejects.toThrow('Database connection failed');
    });
  });

  describe('buyFuel(planetId, quantity)', () => {
    test('should make POST request to /game/fuel/buy with correct data', async () => {
      // Arrange
      const planetId = 1;
      const quantity = 25;
      const mockResponse = {
        message: 'Purchased 25 units of fuel',
        fuelPurchased: quantity,
        totalCost: 125,
        newFuelLevel: 100,
        gameState: {
          id: 1,
          credits: 875,
          fuel: 100,
          maxFuel: 100
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await apiClient.buyFuel(planetId, quantity);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/game/fuel/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({ planetId, quantity })
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle insufficient credits error', async () => {
      // Arrange
      const planetId = 1;
      const quantity = 100;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Insufficient credits' })
      });

      // Act & Assert
      await expect(apiClient.buyFuel(planetId, quantity))
        .rejects.toThrow('Insufficient credits');
    });

    test('should handle fuel capacity exceeded error', async () => {
      // Arrange
      const planetId = 1;
      const quantity = 50;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Fuel purchase would exceed capacity' })
      });

      // Act & Assert
      await expect(apiClient.buyFuel(planetId, quantity))
        .rejects.toThrow('Fuel purchase would exceed capacity');
    });

    test('should validate required parameters', async () => {
      // Test missing planetId
      await expect(apiClient.buyFuel(undefined, 25))
        .rejects.toThrow('Planet ID and quantity are required');

      // Test missing quantity
      await expect(apiClient.buyFuel(1, undefined))
        .rejects.toThrow('Planet ID and quantity are required');

      // Test invalid quantity (zero or negative)
      await expect(apiClient.buyFuel(1, 0))
        .rejects.toThrow('Quantity must be greater than 0');

      await expect(apiClient.buyFuel(1, -5))
        .rejects.toThrow('Quantity must be greater than 0');
    });
  });

  describe('getTravelCost(planetId)', () => {
    test('should make GET request to /game/travel/cost with planetId', async () => {
      // Arrange
      const planetId = 2;
      const mockTravelCost = {
        planetId: 2,
        planetName: 'Mars Station',
        distance: 8,
        fuelRequired: 6,
        turnsRequired: 8,
        totalCost: 60,
        canAfford: true,
        remainingFuelAfterTravel: 19
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTravelCost
      });

      // Act
      const result = await apiClient.getTravelCost(planetId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/game/travel/cost/${planetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockTravelCost);
    });

    test('should handle invalid planet ID', async () => {
      // Arrange
      const invalidPlanetId = 999;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Planet not found' })
      });

      // Act & Assert
      await expect(apiClient.getTravelCost(invalidPlanetId))
        .rejects.toThrow('Planet not found');
    });

    test('should handle same planet travel cost', async () => {
      // Arrange
      const currentPlanetId = 1;
      const mockSamePlanetResponse = {
        planetId: 1,
        planetName: 'Terra Nova',
        distance: 0,
        fuelRequired: 0,
        turnsRequired: 0,
        totalCost: 0,
        canAfford: true,
        remainingFuelAfterTravel: 75,
        warning: 'Already at this planet'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSamePlanetResponse
      });

      // Act
      const result = await apiClient.getTravelCost(currentPlanetId);

      // Assert
      expect(result).toEqual(mockSamePlanetResponse);
      expect(result.warning).toBe('Already at this planet');
    });

    test('should validate planetId parameter', async () => {
      // Test missing planetId
      await expect(apiClient.getTravelCost(undefined))
        .rejects.toThrow('Planet ID is required');

      // Test invalid planetId type
      await expect(apiClient.getTravelCost('invalid'))
        .rejects.toThrow('Planet ID must be a number');
    });

    test('should handle insufficient fuel warning', async () => {
      // Arrange
      const distantPlanetId = 5;
      const mockInsufficientFuelResponse = {
        planetId: 5,
        planetName: 'Distant Mining Station',
        distance: 15,
        fuelRequired: 12,
        turnsRequired: 15,
        totalCost: 120,
        canAfford: false,
        remainingFuelAfterTravel: -5,
        warning: 'Insufficient fuel for this journey'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsufficientFuelResponse
      });

      // Act
      const result = await apiClient.getTravelCost(distantPlanetId);

      // Assert
      expect(result.canAfford).toBe(false);
      expect(result.warning).toBe('Insufficient fuel for this journey');
      expect(result.remainingFuelAfterTravel).toBeLessThan(0);
    });
  });

  describe('Network error handling', () => {
    test('should handle network failures', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Network request failed'));

      // Act & Assert
      await expect(apiClient.getFuelInfo()).rejects.toThrow('Network request failed');
    });

    test('should handle malformed JSON responses', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      // Act & Assert
      await expect(apiClient.getFuelInfo()).rejects.toThrow('Invalid JSON');
    });
  });
});
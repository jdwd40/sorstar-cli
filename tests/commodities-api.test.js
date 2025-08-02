// Commodities System API Tests
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from '../web/js/api.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient - Commodities System Methods', () => {
  let apiClient;
  const mockToken = 'test-jwt-token';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    apiClient = new ApiClient(baseUrl);
    apiClient.setAuthToken(mockToken);
    fetch.mockClear();
  });

  describe('getCommoditiesByPlanet(planetId)', () => {
    test('should make GET request to /planets/:id/commodities endpoint', async () => {
      // Arrange
      const planetId = 1;
      const mockPlanetCommodities = {
        planetId: 1,
        planetName: 'Terra Nova',
        planetType: 'Forest',
        commodities: [
          {
            id: 1,
            name: 'Wood',
            category: 'Materials',
            basePrice: 25,
            currentPrice: 20,
            availability: 'abundant',
            priceModifier: -0.2,
            description: 'High-quality timber from ancient forests'
          },
          {
            id: 8,
            name: 'Medicinal Herbs',
            category: 'Food',
            basePrice: 45,
            currentPrice: 50,
            availability: 'common',
            priceModifier: 0.1,
            description: 'Rare healing plants native to forest worlds'
          }
        ],
        specialties: ['Wood', 'Medicinal Herbs'],
        totalCommodities: 2
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlanetCommodities
      });

      // Act
      const result = await apiClient.getCommoditiesByPlanet(planetId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/planets/${planetId}/commodities`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockPlanetCommodities);
      expect(result.commodities).toHaveLength(2);
      expect(result.planetType).toBe('Forest');
    });

    test('should handle industrial planet commodities', async () => {
      const planetId = 2;
      const mockIndustrialCommodities = {
        planetId: 2,
        planetName: 'Steel Harbor',
        planetType: 'Industrial',
        commodities: [
          {
            id: 3,
            name: 'Metals',
            category: 'Materials',
            basePrice: 60,
            currentPrice: 45,
            availability: 'abundant',
            priceModifier: -0.25,
            description: 'Various refined metals and alloys'
          },
          {
            id: 5,
            name: 'Electronics',
            category: 'Technology',
            basePrice: 120,
            currentPrice: 100,
            availability: 'common',
            priceModifier: -0.15,
            description: 'Advanced electronic components'
          },
          {
            id: 6,
            name: 'Machinery',
            category: 'Technology',
            basePrice: 200,
            currentPrice: 180,
            availability: 'limited',
            priceModifier: -0.1,
            description: 'Industrial machinery and equipment'
          }
        ],
        specialties: ['Metals', 'Electronics', 'Machinery'],
        totalCommodities: 3
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIndustrialCommodities
      });

      const result = await apiClient.getCommoditiesByPlanet(planetId);
      
      expect(result.planetType).toBe('Industrial');
      expect(result.commodities).toHaveLength(3);
      expect(result.specialties).toContain('Metals');
    });

    test('should validate planetId parameter', async () => {
      // Test missing planetId
      await expect(apiClient.getCommoditiesByPlanet(undefined))
        .rejects.toThrow('Planet ID is required');

      // Test invalid planetId type
      await expect(apiClient.getCommoditiesByPlanet('invalid'))
        .rejects.toThrow('Planet ID must be a number');
    });

    test('should handle planet not found error', async () => {
      const invalidPlanetId = 999;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Planet not found' })
      });

      await expect(apiClient.getCommoditiesByPlanet(invalidPlanetId))
        .rejects.toThrow('Planet not found');
    });

    test('should handle empty commodities list', async () => {
      const planetId = 8;
      const mockEmptyCommodities = {
        planetId: 8,
        planetName: 'Barren Outpost',
        planetType: 'Desert',
        commodities: [],
        specialties: [],
        totalCommodities: 0,
        message: 'No commodities available on this planet'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyCommodities
      });

      const result = await apiClient.getCommoditiesByPlanet(planetId);
      
      expect(result.commodities).toHaveLength(0);
      expect(result.totalCommodities).toBe(0);
      expect(result.message).toBeDefined();
    });
  });

  describe('getCommodityCategories()', () => {
    test('should make GET request to /commodities/categories endpoint', async () => {
      // Arrange
      const mockCategories = {
        categories: [
          {
            id: 'materials',
            name: 'Materials',
            description: 'Raw materials and basic resources',
            commodities: ['Wood', 'Metals', 'Stone', 'Crystals'],
            icon: '⚡',
            totalTypes: 4
          },
          {
            id: 'food',
            name: 'Food & Agriculture',
            description: 'Food products and agricultural goods',
            commodities: ['Grain', 'Meat', 'Medicinal Herbs', 'Spices'],
            icon: '🌾',
            totalTypes: 4
          },
          {
            id: 'technology',
            name: 'Technology',
            description: 'Advanced technology and electronics',
            commodities: ['Electronics', 'Machinery', 'Computers', 'Software'],
            icon: '🔧',
            totalTypes: 4
          },
          {
            id: 'energy',
            name: 'Energy',
            description: 'Energy sources and power generation',
            commodities: ['Fuel', 'Solar Cells', 'Batteries', 'Reactors'],
            icon: '⚡',
            totalTypes: 4
          }
        ],
        totalCategories: 4,
        totalCommodityTypes: 16
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      });

      // Act
      const result = await apiClient.getCommodityCategories();

      // Assert
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/commodities/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(result).toEqual(mockCategories);
      expect(result.categories).toHaveLength(4);
      expect(result.totalCategories).toBe(4);
    });

    test('should handle categories with different structures', async () => {
      const mockSimpleCategories = {
        categories: [
          {
            id: 'basic',
            name: 'Basic Goods',
            commodities: ['Food', 'Water', 'Clothing']
          },
          {
            id: 'luxury',
            name: 'Luxury Items',
            commodities: ['Jewelry', 'Art', 'Rare Wines']
          }
        ],
        totalCategories: 2
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSimpleCategories
      });

      const result = await apiClient.getCommodityCategories();
      
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Basic Goods');
      expect(result.categories[1].name).toBe('Luxury Items');
    });

    test('should handle server errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' })
      });

      await expect(apiClient.getCommodityCategories())
        .rejects.toThrow('Database connection failed');
    });

    test('should handle empty categories response', async () => {
      const mockEmptyCategories = {
        categories: [],
        totalCategories: 0,
        message: 'No commodity categories configured'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyCategories
      });

      const result = await apiClient.getCommodityCategories();
      
      expect(result.categories).toHaveLength(0);
      expect(result.totalCategories).toBe(0);
      expect(result.message).toBeDefined();
    });
  });

  describe('Network error handling', () => {
    test('should handle network failures for commodity methods', async () => {
      // Test network failure for getCommoditiesByPlanet
      fetch.mockRejectedValueOnce(new Error('Network request failed'));
      await expect(apiClient.getCommoditiesByPlanet(1))
        .rejects.toThrow('Network request failed');

      // Test network failure for getCommodityCategories
      fetch.mockRejectedValueOnce(new Error('Network request failed'));
      await expect(apiClient.getCommodityCategories())
        .rejects.toThrow('Network request failed');
    });

    test('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(apiClient.getCommoditiesByPlanet(1))
        .rejects.toThrow('Invalid JSON');
    });

    test('should handle timeout scenarios', async () => {
      fetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiClient.getCommodityCategories())
        .rejects.toThrow('Request timeout');
    });
  });
});
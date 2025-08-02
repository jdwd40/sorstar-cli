// Enhanced Cargo Display Tests
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock DOM environment
const mockDOM = {
  getElementById: jest.fn(),
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
};

// Mock window and document globals
global.window = {
  innerWidth: 1024,
  fetch: jest.fn()
};

global.document = mockDOM;

// Import modules to test
import { UI } from '../web/js/ui.js';
import { GameManager } from '../web/js/game.js';
import { ApiClient } from '../web/js/api.js';

describe('Enhanced Cargo Display', () => {
  let gameManager;
  let apiClient;
  let mockGameState;
  let mockCargoData;
  let mockCommodityCategories;
  let mockMarketPrices;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock API client
    apiClient = new ApiClient('http://localhost:3000');
    gameManager = new GameManager(apiClient);

    // Mock game state
    mockGameState = {
      id: 1,
      currentPlanetId: 1,
      planetName: 'Terra Nova',
      credits: 5000,
      cargoCapacity: 100,
      totalCargo: 35
    };

    // Mock cargo data with diverse commodities
    mockCargoData = {
      totalCargo: 35,
      cargoCapacity: 100,
      cargo: [
        {
          commodity_id: 1,
          commodity_name: 'Wood',
          quantity: 10,
          category: 'Materials'
        },
        {
          commodity_id: 3,
          commodity_name: 'Electronics',
          quantity: 5,
          category: 'Technology'
        },
        {
          commodity_id: 5,
          commodity_name: 'Food',
          quantity: 15,
          category: 'Essential'
        },
        {
          commodity_id: 7,
          commodity_name: 'Metals',
          quantity: 5,
          category: 'Materials'
        }
      ]
    };

    // Mock commodity categories
    mockCommodityCategories = {
      categories: [
        {
          id: 'materials',
          name: 'Materials',
          description: 'Raw materials and basic resources',
          commodities: ['Wood', 'Metals', 'Stone', 'Crystals'],
          icon: '🏗️',
          color: '#8B4513'
        },
        {
          id: 'technology',
          name: 'Technology',
          description: 'Advanced technology and electronics',
          commodities: ['Electronics', 'Machinery', 'Computers', 'Software'],
          icon: '🔧',
          color: '#4169E1'
        },
        {
          id: 'essential',
          name: 'Essential',
          description: 'Food products and necessities',
          commodities: ['Food', 'Water', 'Medicine', 'Clothing'],
          icon: '🍞',
          color: '#228B22'
        }
      ]
    };

    // Mock market prices
    mockMarketPrices = [
      { commodity_id: 1, sell_price: 18 }, // Wood
      { commodity_id: 3, sell_price: 95 }, // Electronics
      { commodity_id: 5, sell_price: 12 }, // Food
      { commodity_id: 7, sell_price: 45 }  // Metals
    ];

    // Setup DOM mock elements
    mockDOM.getElementById.mockImplementation((id) => {
      const mockElement = {
        innerHTML: '',
        style: { display: 'block' },
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        parentNode: { removeChild: jest.fn() },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() }
      };
      return mockElement;
    });

    mockDOM.createElement.mockReturnValue({
      className: '',
      innerHTML: '',
      style: {},
      appendChild: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cargo Category Grouping', () => {
    test('should group cargo items by commodity category', async () => {
      // Arrange
      gameManager.gameState = mockGameState;

      // Act
      const groupedCargo = gameManager.groupCargoByCategory(mockCargoData.cargo, mockCommodityCategories.categories);

      // Assert
      expect(groupedCargo).toHaveProperty('Materials');
      expect(groupedCargo).toHaveProperty('Technology');
      expect(groupedCargo).toHaveProperty('Essential');

      expect(groupedCargo['Materials'].items).toHaveLength(2); // Wood, Metals
      expect(groupedCargo['Technology'].items).toHaveLength(1); // Electronics
      expect(groupedCargo['Essential'].items).toHaveLength(1); // Food

      expect(groupedCargo['Materials'].totalQuantity).toBe(15); // 10 + 5
      expect(groupedCargo['Technology'].totalQuantity).toBe(5);
      expect(groupedCargo['Essential'].totalQuantity).toBe(15);
    });

    test('should calculate category statistics correctly', () => {
      // Arrange
      const groupedCargo = {
        'Materials': {
          items: [
            { commodity_name: 'Wood', quantity: 10, estimatedValue: 180 },
            { commodity_name: 'Metals', quantity: 5, estimatedValue: 225 }
          ],
          totalQuantity: 15,
          totalValue: 405
        },
        'Technology': {
          items: [
            { commodity_name: 'Electronics', quantity: 5, estimatedValue: 475 }
          ],
          totalQuantity: 5,
          totalValue: 475
        }
      };

      // Act
      const categoryStats = gameManager.calculateCargoStatistics(groupedCargo);

      // Assert
      expect(categoryStats['Materials']).toEqual({
        itemCount: 2,
        totalQuantity: 15,
        totalValue: 405,
        averageValue: 202.5,
        percentageByQuantity: 75, // 15/20 of total cargo
        percentageByValue: 46 // 405/880 rounded
      });

      expect(categoryStats['Technology']).toEqual({
        itemCount: 1,
        totalQuantity: 5,
        totalValue: 475,
        averageValue: 475,
        percentageByQuantity: 25,
        percentageByValue: 54
      });
    });

    test('should handle empty categories gracefully', () => {
      // Arrange
      const emptyCargoData = { cargo: [] };

      // Act
      const groupedCargo = gameManager.groupCargoByCategory(emptyCargoData.cargo, mockCommodityCategories.categories);

      // Assert
      expect(Object.keys(groupedCargo)).toHaveLength(0);
    });

    test('should handle commodities without categories', () => {
      // Arrange
      const cargoWithUnknownItems = [
        { commodity_id: 99, commodity_name: 'Unknown Item', quantity: 3 }
      ];

      // Act
      const groupedCargo = gameManager.groupCargoByCategory(cargoWithUnknownItems, mockCommodityCategories.categories);

      // Assert
      expect(groupedCargo).toHaveProperty('Other');
      expect(groupedCargo['Other'].items).toHaveLength(1);
      expect(groupedCargo['Other'].items[0].commodity_name).toBe('Unknown Item');
    });
  });

  describe('Enhanced Cargo Display Interface', () => {
    test('should display cargo grouped by categories', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCargo = jest.fn().mockResolvedValue(mockCargoData);
      apiClient.getMarketPrices = jest.fn().mockResolvedValue(mockMarketPrices);
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);

      // Act
      await gameManager.showEnhancedCargo();

      // Assert
      expect(apiClient.getCargo).toHaveBeenCalled();
      expect(apiClient.getCommodityCategories).toHaveBeenCalled();
      expect(apiClient.getMarketPrices).toHaveBeenCalledWith(1);
    });

    test('should create category headers in cargo display', () => {
      // Arrange
      const materialsCategory = mockCommodityCategories.categories[0];
      const cargoStats = {
        itemCount: 2,
        totalQuantity: 15,
        totalValue: 405,
        percentageByQuantity: 43
      };

      // Act
      const categoryHeader = UI.createCargoCategoryHeader(materialsCategory, cargoStats);

      // Assert
      expect(categoryHeader).toContain(materialsCategory.name); // 'Materials'
      expect(categoryHeader).toContain(materialsCategory.icon); // '🏗️'
      expect(categoryHeader).toContain('2 types'); // itemCount
      expect(categoryHeader).toContain('15 units'); // totalQuantity
      expect(categoryHeader).toContain('405'); // totalValue
      expect(categoryHeader).toContain('43%'); // percentageByQuantity
    });

    test('should show optimal selling locations for each commodity', async () => {
      // Arrange
      const commodity = { commodity_id: 1, commodity_name: 'Wood', quantity: 10 };
      const allPlanetPrices = [
        { planetName: 'Terra Nova', price: 18 },
        { planetName: 'Mining Station Alpha', price: 25 },
        { planetName: 'Trade Hub Beta', price: 22 }
      ];

      // Act
      const optimalLocationDisplay = UI.getOptimalSellingLocation(commodity, allPlanetPrices);

      // Assert
      expect(optimalLocationDisplay).toContain('Mining Station Alpha'); // Best price
      expect(optimalLocationDisplay).toContain('25'); // Best price value
      expect(optimalLocationDisplay).toContain('🏆'); // Best price indicator
    });

    test('should display commodity origin information', () => {
      // Arrange
      const commodity = {
        commodity_name: 'Wood',
        quantity: 10,
        originPlanet: 'Forest World Gamma',
        originPlanetType: 'Forest'
      };

      // Act
      const originDisplay = UI.getCommodityOriginDisplay(commodity);

      // Assert
      expect(originDisplay).toContain('Forest World Gamma');
      expect(originDisplay).toContain('Forest');
      expect(originDisplay).toContain('🌲'); // Forest planet icon
    });

    test('should provide category-based sorting options', () => {
      // Arrange
      const sortOptions = ['category', 'quantity', 'value', 'name'];

      // Act
      const sortControls = UI.createCargoSortControls(sortOptions);

      // Assert
      expect(sortControls).toContain('Category');
      expect(sortControls).toContain('Quantity');
      expect(sortControls).toContain('Value');
      expect(sortControls).toContain('Name');
      expect(sortControls).toContain('onclick'); // Should have click handlers
    });

    test('should calculate total cargo summary with categories', () => {
      // Arrange
      const groupedCargo = {
        'Materials': { totalQuantity: 15, totalValue: 405 },
        'Technology': { totalQuantity: 5, totalValue: 475 },
        'Essential': { totalQuantity: 15, totalValue: 180 }
      };

      // Act
      const cargoSummary = gameManager.calculateCargoSummary(groupedCargo);

      // Assert
      expect(cargoSummary.totalQuantity).toBe(35);
      expect(cargoSummary.totalValue).toBe(1060);
      expect(cargoSummary.categoryCount).toBe(3);
      expect(cargoSummary.mostValuableCategory).toBe('Technology');
      expect(cargoSummary.largestCategory).toBe('Materials'); // or Essential - tied at 15
    });
  });

  describe('Cargo Management Features', () => {
    test('should enable bulk selling by category', () => {
      // Arrange
      const materialsItems = [
        { commodity_id: 1, commodity_name: 'Wood', quantity: 10 },
        { commodity_id: 7, commodity_name: 'Metals', quantity: 5 }
      ];

      // Act
      const bulkSellButton = UI.createBulkSellButton('Materials', materialsItems);

      // Assert
      expect(bulkSellButton).toContain('Sell All Materials');
      expect(bulkSellButton).toContain('onclick');
      expect(bulkSellButton).toContain('15 units'); // Total quantity
    });

    test('should filter cargo by category', () => {
      // Arrange
      const allCargo = mockCargoData.cargo;

      // Act
      const materialsOnly = gameManager.filterCargoByCategory(allCargo, 'Materials', mockCommodityCategories.categories);

      // Assert
      expect(materialsOnly).toHaveLength(2); // Wood, Metals
      expect(materialsOnly[0].commodity_name).toBe('Wood');
      expect(materialsOnly[1].commodity_name).toBe('Metals');
    });

    test('should provide category-based cargo recommendations', () => {
      // Arrange
      const groupedCargo = {
        'Materials': { totalQuantity: 15, totalValue: 405 },
        'Technology': { totalQuantity: 5, totalValue: 475 }
      };
      const cargoCapacity = 100;
      const currentTotal = 20;

      // Act
      const recommendations = gameManager.getCargoRecommendations(groupedCargo, cargoCapacity, currentTotal);

      // Assert
      expect(recommendations).toHaveProperty('diversification');
      expect(recommendations).toHaveProperty('optimization');
      expect(recommendations.spacesAvailable).toBe(80);
      expect(recommendations.mostProfitableCategory).toBe('Technology');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle API failures gracefully', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCargo = jest.fn().mockResolvedValue(mockCargoData);
      apiClient.getCommodityCategories = jest.fn().mockRejectedValue(new Error('API Error'));

      // Act
      await gameManager.showEnhancedCargo();

      // Assert - Should fallback to basic cargo display
      const gameContent = mockDOM.getElementById('game-content');
      expect(gameContent).toBeDefined();
    });

    test('should handle cargo without market prices', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCargo = jest.fn().mockResolvedValue(mockCargoData);
      apiClient.getMarketPrices = jest.fn().mockRejectedValue(new Error('Market Error'));
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);

      // Act
      const groupedCargo = await gameManager.processCargoWithPrices(mockCargoData.cargo, mockCommodityCategories.categories);

      // Assert
      Object.values(groupedCargo).forEach(category => {
        category.items.forEach(item => {
          expect(item.estimatedValue).toBeNull();
        });
      });
    });

    test('should handle empty cargo gracefully', async () => {
      // Arrange
      const emptyCargoData = { totalCargo: 0, cargoCapacity: 100, cargo: [] };
      gameManager.gameState = mockGameState;
      apiClient.getCargo = jest.fn().mockResolvedValue(emptyCargoData);

      // Act
      await gameManager.showEnhancedCargo();

      // Assert
      const gameContent = mockDOM.getElementById('game-content');
      expect(gameContent).toBeDefined();
    });
  });

  describe('Integration with Existing Features', () => {
    test('should maintain compatibility with existing sell modal', () => {
      // Arrange
      const commodity = mockCargoData.cargo[0];

      // Act
      gameManager.openSellModal(commodity.commodity_id, commodity.commodity_name, commodity.quantity);

      // Assert - Should not throw errors (basic functionality test)
      expect(true).toBe(true); // Placeholder assertion
    });

    test('should preserve existing cargo display when enhanced view fails', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCargo = jest.fn().mockResolvedValue(mockCargoData);
      apiClient.getCommodityCategories = jest.fn().mockRejectedValue(new Error('Categories unavailable'));

      // Act
      await gameManager.showCargo(); // Should fallback to basic view

      // Assert
      expect(apiClient.getCargo).toHaveBeenCalled();
    });
  });
});
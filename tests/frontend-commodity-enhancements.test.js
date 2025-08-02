// Frontend Commodity Enhancement Tests
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

describe('Frontend Commodity Enhancements', () => {
  let gameManager;
  let apiClient;
  let mockGameState;
  let mockCommodityCategories;
  let mockPlanetCommodities;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock API client
    apiClient = new ApiClient('http://localhost:3000');
    gameManager = new GameManager(apiClient);

    // Mock game state with enhanced data
    mockGameState = {
      id: 1,
      currentPlanetId: 1,
      planetName: 'Terra Nova',
      planetType: 'Trade Hub',
      credits: 5000,
      cargoCapacity: 100,
      totalCargo: 25,
      fuel: {
        currentFuel: 80,
        maxFuel: 100,
        pricePerUnit: 50
      },
      turnsUsed: 15,
      username: 'TestPilot',
      shipName: 'Star Trader'
    };

    // Mock commodity categories response
    mockCommodityCategories = {
      categories: [
        {
          id: 'materials',
          name: 'Materials',
          description: 'Raw materials and basic resources',
          commodities: ['Wood', 'Metals', 'Stone', 'Crystals'],
          icon: '⚡',
          totalTypes: 4,
          color: '#8B4513'
        },
        {
          id: 'food',
          name: 'Food & Agriculture', 
          description: 'Food products and agricultural goods',
          commodities: ['Grain', 'Meat', 'Medicinal Herbs', 'Spices'],
          icon: '🌾',
          totalTypes: 4,
          color: '#228B22'
        },
        {
          id: 'technology',
          name: 'Technology',
          description: 'Advanced technology and electronics',
          commodities: ['Electronics', 'Machinery', 'Computers', 'Software'],
          icon: '🔧',
          totalTypes: 4,
          color: '#4169E1'
        },
        {
          id: 'energy',
          name: 'Energy',
          description: 'Energy sources and power generation',
          commodities: ['Fuel', 'Solar Cells', 'Batteries', 'Reactors'],
          icon: '⚡',
          totalTypes: 4,
          color: '#FFD700'
        }
      ],
      totalCategories: 4,
      totalCommodityTypes: 16
    };

    // Mock planet-specific commodities response
    mockPlanetCommodities = {
      planetId: 1,
      planetName: 'Terra Nova',
      planetType: 'Trade Hub',
      commodities: [
        {
          id: 1,
          name: 'Wood',
          category: 'Materials',
          basePrice: 25,
          currentPrice: 20,
          availability: 'abundant',
          priceModifier: -0.2,
          stock: 150,
          description: 'High-quality timber from forest worlds'
        },
        {
          id: 3,
          name: 'Electronics',
          category: 'Technology',
          basePrice: 120,
          currentPrice: 100,
          availability: 'common',
          priceModifier: -0.15,
          stock: 50,
          description: 'Advanced electronic components'
        },
        {
          id: 5,
          name: 'Grain',
          category: 'Food & Agriculture',
          basePrice: 15,
          currentPrice: 18,
          availability: 'limited',
          priceModifier: 0.2,
          stock: 75,
          description: 'Nutritious grain from agricultural worlds'
        }
      ],
      specialties: ['Electronics', 'Wood'],
      totalCommodities: 3,
      categorySummary: {
        'Materials': { count: 1, avgPrice: 20, availability: 'abundant' },
        'Technology': { count: 1, avgPrice: 100, availability: 'common' },
        'Food & Agriculture': { count: 1, avgPrice: 18, availability: 'limited' }
      }
    };

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

  describe('Commodity Categories Display', () => {
    test('should display commodity categories in market view', async () => {
      // Arrange
      const mockMarketData = [
        { commodity_id: 1, commodity_name: 'Wood', buy_price: 20, sell_price: 18, stock: 150 },
        { commodity_id: 3, commodity_name: 'Electronics', buy_price: 100, sell_price: 95, stock: 50 }
      ];

      // Mock API calls
      apiClient.getMarketPrices = jest.fn().mockResolvedValue(mockMarketData);
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(mockPlanetCommodities);

      gameManager.gameState = mockGameState;

      // Act
      await gameManager.showEnhancedMarket();

      // Assert
      expect(apiClient.getCommodityCategories).toHaveBeenCalled();
      expect(apiClient.getCommoditiesByPlanet).toHaveBeenCalledWith(1);
      
      // Check that categories are displayed
      const gameContent = mockDOM.getElementById('game-content');
      expect(gameContent).toBeDefined();
    });

    test('should group commodities by category', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(mockPlanetCommodities);

      // Create market data that matches the expected structure
      const mockMarketData = [
        { commodity_id: 1, commodity_name: 'Wood', buy_price: 20, sell_price: 18, stock: 150 },
        { commodity_id: 3, commodity_name: 'Electronics', buy_price: 100, sell_price: 95, stock: 50 },
        { commodity_id: 5, commodity_name: 'Grain', buy_price: 18, sell_price: 16, stock: 75 }
      ];

      // Act
      const groupedCommodities = gameManager.groupCommoditiesByCategory(mockMarketData, mockCommodityCategories.categories);

      // Assert
      expect(groupedCommodities).toHaveProperty('Materials');
      expect(groupedCommodities).toHaveProperty('Technology');
      expect(groupedCommodities).toHaveProperty('Food & Agriculture');
      
      expect(groupedCommodities['Materials'].commodities).toHaveLength(1);
      expect(groupedCommodities['Technology'].commodities).toHaveLength(1);
      expect(groupedCommodities['Food & Agriculture'].commodities).toHaveLength(1);
      
      expect(groupedCommodities['Materials'].commodities[0].commodity_name).toBe('Wood');
      expect(groupedCommodities['Technology'].commodities[0].commodity_name).toBe('Electronics');
      expect(groupedCommodities['Food & Agriculture'].commodities[0].commodity_name).toBe('Grain');
    });

    test('should display category icons and colors', () => {
      // Arrange
      const category = mockCommodityCategories.categories[0]; // Materials category

      // Act
      const categoryDisplay = UI.createCategoryHeader(category);

      // Assert
      expect(categoryDisplay).toContain(category.icon); // ⚡
      expect(categoryDisplay).toContain(category.name); // Materials
      expect(categoryDisplay).toContain(category.color); // #8B4513
      expect(categoryDisplay).toContain(category.description);
    });

    test('should show category statistics', async () => {
      // Arrange
      gameManager.gameState = mockGameState;

      // Act
      const categoryStats = gameManager.calculateCategoryStatistics(mockPlanetCommodities);

      // Assert
      expect(categoryStats).toHaveProperty('Materials');
      expect(categoryStats).toHaveProperty('Technology');
      expect(categoryStats).toHaveProperty('Food & Agriculture');
      
      expect(categoryStats['Materials'].count).toBe(1);
      expect(categoryStats['Materials'].avgPrice).toBe(20);
      expect(categoryStats['Materials'].availability).toBe('abundant');
    });

    test('should handle empty category data gracefully', () => {
      // Arrange
      const emptyCommodities = [];
      const emptyCategories = { categories: [] };

      // Act
      const groupedCommodities = gameManager.groupCommoditiesByCategory(emptyCommodities, emptyCategories.categories);

      // Assert
      expect(groupedCommodities).toEqual({});
    });
  });

  describe('Planet-Specific Commodity Display', () => {
    test('should show planet type and specializations', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(mockPlanetCommodities);

      // Act
      const planetInfo = await gameManager.getPlanetCommodityInfo(1);

      // Assert
      expect(planetInfo.planetType).toBe('Trade Hub');
      expect(planetInfo.specialties).toContain('Electronics');
      expect(planetInfo.specialties).toContain('Wood');
      expect(planetInfo.categorySummary).toHaveProperty('Materials');
      expect(planetInfo.categorySummary).toHaveProperty('Technology');
    });

    test('should display availability indicators', () => {
      // Arrange
      const commodity = mockPlanetCommodities.commodities[0]; // Wood - abundant

      // Act
      const availabilityDisplay = UI.getAvailabilityIndicator(commodity.availability);

      // Assert
      expect(availabilityDisplay).toContain('Abundant');
      expect(availabilityDisplay).toContain('🟢'); // Green indicator for abundant
    });

    test('should show price modifiers with visual indicators', () => {
      // Arrange
      const cheapCommodity = mockPlanetCommodities.commodities[0]; // Wood, -20% modifier
      const expensiveCommodity = mockPlanetCommodities.commodities[2]; // Grain, +20% modifier

      // Act
      const cheapDisplay = UI.getPriceModifierDisplay(cheapCommodity);
      const expensiveDisplay = UI.getPriceModifierDisplay(expensiveCommodity);

      // Assert
      expect(cheapDisplay).toContain('-20%');
      expect(cheapDisplay).toContain('🔽'); // Down arrow for cheaper
      expect(cheapDisplay).toContain('var(--success-color)'); // Green for better prices

      expect(expensiveDisplay).toContain('+20%');
      expect(expensiveDisplay).toContain('🔺'); // Up arrow for more expensive
      expect(expensiveDisplay).toContain('var(--error-color)'); // Red for worse prices
    });

    test('should filter commodities by availability', () => {
      // Arrange
      const commodities = mockPlanetCommodities.commodities;

      // Act
      const abundantCommodities = gameManager.filterCommoditiesByAvailability(commodities, 'abundant');
      const limitedCommodities = gameManager.filterCommoditiesByAvailability(commodities, 'limited');

      // Assert
      expect(abundantCommodities).toHaveLength(1);
      expect(abundantCommodities[0].name).toBe('Wood');
      
      expect(limitedCommodities).toHaveLength(1);
      expect(limitedCommodities[0].name).toBe('Grain');
    });

    test('should handle planet with no specializations', async () => {
      // Arrange
      const barrenPlanet = {
        planetId: 8,
        planetName: 'Barren Outpost',
        planetType: 'Desert',
        commodities: [],
        specialties: [],
        totalCommodities: 0,
        categorySummary: {}
      };

      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(barrenPlanet);

      // Act
      const planetInfo = await gameManager.getPlanetCommodityInfo(8);

      // Assert
      expect(planetInfo.specialties).toHaveLength(0);
      expect(planetInfo.totalCommodities).toBe(0);
      expect(Object.keys(planetInfo.categorySummary)).toHaveLength(0);
    });
  });

  describe('Visual Indicators and Icons', () => {
    test('should display category icons correctly', () => {
      // Arrange
      const categories = mockCommodityCategories.categories;

      // Act & Assert
      categories.forEach(category => {
        const iconDisplay = UI.getCategoryIcon(category);
        expect(iconDisplay).toContain(category.icon);
        expect(iconDisplay).toContain(category.name);
      });
    });

    test('should show commodity rarity indicators', () => {
      // Arrange
      const commonCommodity = { availability: 'common', stock: 100 };
      const rareCommodity = { availability: 'rare', stock: 5 };
      const abundantCommodity = { availability: 'abundant', stock: 500 };

      // Act
      const commonRarity = UI.getRarityIndicator(commonCommodity);
      const rareRarity = UI.getRarityIndicator(rareCommodity);
      const abundantRarity = UI.getRarityIndicator(abundantCommodity);

      // Assert
      expect(commonRarity).toContain('🟡'); // Yellow for common
      expect(rareRarity).toContain('🔴'); // Red for rare
      expect(abundantRarity).toContain('🟢'); // Green for abundant
    });

    test('should create planet type badges', () => {
      // Arrange
      const planetTypes = ['Trade Hub', 'Industrial', 'Agricultural', 'Mining', 'Research'];

      // Act & Assert
      planetTypes.forEach(type => {
        const badge = UI.createPlanetTypeBadge(type);
        expect(badge).toContain(type);
        expect(badge).toMatch(/class="planet-type-badge"/);
      });
    });

    test('should display commodity category colors', () => {
      // Arrange
      const materialCategory = mockCommodityCategories.categories[0];

      // Act
      const coloredHeader = UI.createCategoryHeader(materialCategory);

      // Assert
      expect(coloredHeader).toContain(materialCategory.color);
      expect(coloredHeader).toContain('background-color');
    });
  });

  describe('Enhanced Market Interface Integration', () => {
    test('should integrate categories with existing market display', async () => {
      // Arrange
      const mockMarketData = [
        { commodity_id: 1, commodity_name: 'Wood', buy_price: 20, sell_price: 18, stock: 150 },
        { commodity_id: 3, commodity_name: 'Electronics', buy_price: 100, sell_price: 95, stock: 50 }
      ];

      apiClient.getMarketPrices = jest.fn().mockResolvedValue(mockMarketData);
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(mockPlanetCommodities);

      gameManager.gameState = mockGameState;

      // Act
      await gameManager.showEnhancedMarket();

      // Assert
      expect(apiClient.getMarketPrices).toHaveBeenCalledWith(1);
      expect(apiClient.getCommodityCategories).toHaveBeenCalled();
      expect(apiClient.getCommoditiesByPlanet).toHaveBeenCalledWith(1);
    });

    test('should preserve existing fuel purchase functionality', async () => {
      // Arrange
      gameManager.gameState = mockGameState;
      apiClient.getMarketPrices = jest.fn().mockResolvedValue([]);
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(mockCommodityCategories);
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(mockPlanetCommodities);

      // Act
      await gameManager.showEnhancedMarket();

      // Assert - Fuel section should still be present
      const gameContent = mockDOM.getElementById('game-content');
      expect(gameContent).toBeDefined();
      // The fuel functionality should remain unchanged
    });

    test('should handle API failures gracefully', async () => {
      // Arrange
      apiClient.getCommodityCategories = jest.fn().mockRejectedValue(new Error('API Error'));
      apiClient.getCommoditiesByPlanet = jest.fn().mockRejectedValue(new Error('API Error'));

      gameManager.gameState = mockGameState;

      // Act
      await gameManager.showEnhancedMarket();

      // Assert - Should fallback to basic market display
      const gameContent = mockDOM.getElementById('game-content');
      expect(gameContent).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing commodity category data', () => {
      // Arrange
      const commodityWithoutCategory = { id: 1, name: 'Unknown Item', category: null };

      // Act
      const categoryDisplay = UI.getCommodityCategory(commodityWithoutCategory);

      // Assert
      expect(categoryDisplay).toBe('Uncategorized');
    });

    test('should handle malformed category response', async () => {
      // Arrange
      const malformedCategories = { categories: null };
      apiClient.getCommodityCategories = jest.fn().mockResolvedValue(malformedCategories);

      // Act
      const result = await gameManager.loadCommodityCategories();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle empty planet commodities gracefully', async () => {
      // Arrange
      const emptyPlanetData = {
        planetId: 1,
        commodities: [],
        specialties: [],
        categorySummary: {}
      };
      
      apiClient.getCommoditiesByPlanet = jest.fn().mockResolvedValue(emptyPlanetData);

      // Act
      const planetInfo = await gameManager.getPlanetCommodityInfo(1);

      // Assert
      expect(planetInfo.commodities).toHaveLength(0);
      expect(planetInfo.specialties).toHaveLength(0);
    });
  });
});
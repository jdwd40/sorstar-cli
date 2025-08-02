// Enhanced Planets Integration API Tests
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from '../web/js/api.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient - Enhanced Planets Integration', () => {
  let apiClient;
  const mockToken = 'test-jwt-token';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    apiClient = new ApiClient(baseUrl);
    apiClient.setAuthToken(mockToken);
    fetch.mockClear();
  });

  describe('Complete Planet System Integration', () => {
    test('should provide complete planet ecosystem with all enhanced data', async () => {
      // Mock enhanced getPlanets response
      const mockEnhancedPlanets = [
        {
          id: 1,
          name: 'Terra Nova',
          type: 'Forest',
          description: 'A lush forest world with abundant natural resources',
          distanceFromPlayer: 0,
          travelTime: 0,
          fuelRequired: 0,
          canReach: true,
          isCurrentPlanet: true,
          fuelPrice: 8,
          specialties: ['Wood', 'Medicinal Herbs'],
          economicModifiers: {
            foodPrices: 0.1,
            luxuryPrices: -0.15
          }
        },
        {
          id: 2,
          name: 'Steel Harbor',
          type: 'Industrial',
          description: 'A heavily industrialized world with massive factories',
          distanceFromPlayer: 6,
          travelTime: 6,
          fuelRequired: 5,
          canReach: true,
          isCurrentPlanet: false,
          fuelPrice: 12,
          specialties: ['Metals', 'Electronics', 'Machinery'],
          economicModifiers: {
            metalPrices: -0.3,
            techPrices: -0.2
          }
        },
        {
          id: 7,
          name: 'Outer Rim Mining Station',
          type: 'City',
          description: 'Distant trading outpost with cheaper fuel',
          distanceFromPlayer: 10,
          travelTime: 10,
          fuelRequired: 8,
          canReach: false, // Insufficient fuel
          isCurrentPlanet: false,
          isDistantPlanet: true,
          fuelPrice: 5, // Cheaper on distant planets
          specialties: ['Rare Minerals', 'Industrial Equipment'],
          economicModifiers: {
            fuelPrices: -0.4,
            rareMaterialPrices: -0.25
          }
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedPlanets
      });

      // Act
      const planets = await apiClient.getPlanets();

      // Assert
      expect(planets).toHaveLength(3);
      
      // Verify current planet
      const currentPlanet = planets.find(p => p.isCurrentPlanet);
      expect(currentPlanet).toBeDefined();
      expect(currentPlanet.distanceFromPlayer).toBe(0);
      expect(currentPlanet.type).toBe('Forest');
      
      // Verify distant planet
      const distantPlanet = planets.find(p => p.isDistantPlanet);
      expect(distantPlanet).toBeDefined();
      expect(distantPlanet.fuelPrice).toBe(5); // Cheaper fuel
      expect(distantPlanet.canReach).toBe(false);
      
      // Verify industrial planet
      const industrialPlanet = planets.find(p => p.type === 'Industrial');
      expect(industrialPlanet.specialties).toContain('Metals');
      expect(industrialPlanet.economicModifiers.metalPrices).toBe(-0.3);
    });

    test('should handle planet details with commodities integration', async () => {
      const planetId = 2;
      
      // Mock getPlanetDetails response
      const mockPlanetDetails = {
        id: 2,
        name: 'Steel Harbor',
        type: 'Industrial',
        description: 'A heavily industrialized world with massive factories',
        distance: 6,
        distanceFromPlayer: 6,
        classification: 'industrial',
        atmosphere: 'polluted',
        temperature: 'hot',
        specialFeatures: ['Mega factories', 'Mining complexes', 'Trade hubs'],
        fuelPrice: 12,
        commoditySpecialties: ['Metals', 'Machinery', 'Electronics'],
        economicProfile: {
          primaryIndustries: ['Manufacturing', 'Mining', 'Technology'],
          tradeVolume: 'high',
          economicStability: 'stable'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlanetDetails
      });

      const planetDetails = await apiClient.getPlanetDetails(planetId);
      
      expect(planetDetails.type).toBe('Industrial');
      expect(planetDetails.commoditySpecialties).toContain('Metals');
      expect(planetDetails.economicProfile.primaryIndustries).toContain('Manufacturing');
      expect(planetDetails.fuelPrice).toBe(12);
    });

    test('should provide comprehensive travel planning data', async () => {
      const planetId = 3;
      
      // Mock getPlanetDistanceInfo response with comprehensive travel data
      const mockTravelData = {
        planetId: 3,
        planetName: 'Jungle Prime',
        planetType: 'Jungle',
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
          totalDistance: 6,
          alternativeRoutes: [
            {
              via: [2],
              totalDistance: 8,
              totalFuelRequired: 7,
              description: 'Via Steel Harbor'
            }
          ]
        },
        destinationInfo: {
          fuelPrice: 7,
          commoditySpecialties: ['Medicinal Herbs', 'Exotic Animals'],
          marketOpportunities: [
            {
              commodity: 'Medicinal Herbs',
              expectedProfit: 150,
              riskLevel: 'low'
            }
          ]
        },
        travelRecommendations: {
          bestTimeToTravel: 'immediate',
          fuelAdvice: 'Current fuel sufficient for round trip',
          tradingAdvice: 'Excellent profit opportunities for medicinal herbs'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTravelData
      });

      const travelData = await apiClient.getPlanetDistanceInfo(planetId);
      
      expect(travelData.canReach).toBe(true);
      expect(travelData.destinationInfo.marketOpportunities).toHaveLength(1);
      expect(travelData.routeInfo.alternativeRoutes).toHaveLength(1);
      expect(travelData.travelRecommendations.fuelAdvice).toContain('sufficient');
    });

    test('should handle commodities system with planet type integration', async () => {
      const planetId = 3; // Jungle planet
      
      const mockJungleCommodities = {
        planetId: 3,
        planetName: 'Jungle Prime',
        planetType: 'Jungle',
        commodities: [
          {
            id: 8,
            name: 'Medicinal Herbs',
            category: 'Food',
            basePrice: 45,
            currentPrice: 32, // 30% discount due to planet specialty
            availability: 'abundant',
            priceModifier: -0.3,
            description: 'Rare healing plants native to jungle worlds',
            planetBonus: true
          },
          {
            id: 9,
            name: 'Exotic Animals',
            category: 'Luxury',
            basePrice: 200,
            currentPrice: 160,
            availability: 'common',
            priceModifier: -0.2,
            description: 'Rare creatures from deep jungle habitats',
            planetBonus: true
          },
          {
            id: 3,
            name: 'Metals',
            category: 'Materials',
            basePrice: 60,
            currentPrice: 84, // 40% markup - not a specialty
            availability: 'scarce',
            priceModifier: 0.4,
            description: 'Basic metals - expensive due to lack of mining',
            planetBonus: false
          }
        ],
        specialties: ['Medicinal Herbs', 'Exotic Animals'],
        totalCommodities: 3,
        planetBonuses: {
          'Food': -0.25,
          'Luxury': -0.15,
          'Materials': 0.35
        },
        tradingTips: [
          'Excellent source for medicinal herbs',
          'Avoid buying metals here - very expensive'
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJungleCommodities
      });

      const commodities = await apiClient.getCommoditiesByPlanet(planetId);
      
      expect(commodities.planetType).toBe('Jungle');
      expect(commodities.specialties).toContain('Medicinal Herbs');
      expect(commodities.planetBonuses['Food']).toBe(-0.25);
      expect(commodities.tradingTips).toHaveLength(2);
      
      // Check specialty items have bonuses
      const medicinalHerbs = commodities.commodities.find(c => c.name === 'Medicinal Herbs');
      expect(medicinalHerbs.planetBonus).toBe(true);
      expect(medicinalHerbs.priceModifier).toBe(-0.3);
    });

    test('should integrate all systems for complete travel workflow', async () => {
      // Test complete workflow: Check game state -> View planets -> Get planet details -> Plan travel
      
      // Step 1: Mock game state with fuel info
      const mockGameState = {
        fuel: {
          current: 75,
          maximum: 100,
          range: {
            reachablePlanets: [1, 2, 3, 4, 5, 6],
            unreachablePlanets: [7, 8]
          }
        },
        currentPlanet: { id: 1, name: 'Terra Nova' }
      };

      // Step 2: Mock travel cost calculation
      const mockTravelCost = {
        planetId: 2,
        fuelRequired: 6,
        canAfford: true,
        remainingFuelAfterTravel: 69
      };

      // Setup mocks for workflow
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockGameState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTravelCost });

      // Execute workflow
      const gameState = await apiClient.getGameState();
      const travelCost = await apiClient.getTravelCost(2);

      // Verify workflow integration
      expect(gameState.fuel.current).toBe(75);
      expect(travelCost.fuelRequired).toBe(6);
      expect(travelCost.remainingFuelAfterTravel).toBe(69);
      expect(gameState.fuel.range.reachablePlanets).toContain(2);
    });
  });

  describe('Planet Type System Integration', () => {
    test('should handle all planet types with consistent data structure', async () => {
      // Test data for all planet types
      const planetTypes = ['Forest', 'Industrial', 'Jungle', 'City', 'Desert', 'Mining'];
      
      for (const planetType of planetTypes) {
        const mockPlanetData = {
          id: 1,
          name: `Test ${planetType} Planet`,
          type: planetType,
          description: `A typical ${planetType.toLowerCase()} world`,
          specialFeatures: [`${planetType} feature 1`, `${planetType} feature 2`],
          fuelPrice: planetType === 'City' ? 5 : 10, // Distant cities have cheaper fuel
          commoditySpecialties: getPlanetTypeSpecialties(planetType)
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlanetData
        });

        const result = await apiClient.getPlanetDetails(1);
        
        expect(result.type).toBe(planetType);
        expect(result.specialFeatures).toHaveLength(2);
        expect(result.commoditySpecialties).toBeDefined();
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle cascading failures gracefully', async () => {
      // Test what happens when multiple endpoints fail
      fetch.mockRejectedValue(new Error('Network failure'));

      await expect(apiClient.getPlanets()).rejects.toThrow('Network failure');
      await expect(apiClient.getPlanetDetails(1)).rejects.toThrow('Network failure');
      await expect(apiClient.getCommoditiesByPlanet(1)).rejects.toThrow('Network failure');
    });

    test('should handle partial system failures', async () => {
      // Planet list works but details fail
      const mockPlanets = [{ id: 1, name: 'Test Planet', type: 'Forest' }];
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPlanets })
        .mockResolvedValueOnce({ 
          ok: false, 
          status: 500, 
          json: async () => ({ error: 'Planet details service unavailable' })
        });

      const planets = await apiClient.getPlanets();
      expect(planets).toHaveLength(1);

      await expect(apiClient.getPlanetDetails(1))
        .rejects.toThrow('Planet details service unavailable');
    });
  });
});

// Helper function for planet type specialties
function getPlanetTypeSpecialties(planetType) {
  const specialties = {
    'Forest': ['Wood', 'Medicinal Herbs', 'Wildlife'],
    'Industrial': ['Metals', 'Electronics', 'Machinery'],
    'Jungle': ['Exotic Animals', 'Medicinal Herbs', 'Rare Plants'],
    'City': ['Luxury Goods', 'Services', 'Information'],
    'Desert': ['Minerals', 'Solar Energy', 'Survival Gear'],
    'Mining': ['Rare Metals', 'Crystals', 'Industrial Equipment']
  };
  return specialties[planetType] || ['Basic Commodities'];
}
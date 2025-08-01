import { Game } from '../models/Game.js';
import { Ship } from '../models/Ship.js';
import { Planet } from '../models/Planet.js';

export class GameController {
  static async getShips(req, res) {
    try {
      const ships = await Ship.findAll();
      res.json(ships.map(ship => ship.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPlanets(req, res) {
    try {
      const planets = await Planet.findAll();
      res.json(planets.map(planet => planet.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getGameState(req, res) {
    try {
      const gameState = await Game.findByUserId(req.user.id);
      if (gameState) {
        const result = gameState.toJSON();
        result.username = req.user.username;
        res.json(result);
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async startGame(req, res) {
    try {
      const { shipId } = req.body;
      
      if (!shipId) {
        return res.status(400).json({ error: 'Ship ID required' });
      }

      const existingGame = await Game.findByUserId(req.user.id);
      if (existingGame) {
        return res.status(400).json({ error: 'Game already exists for this user' });
      }

      const game = await Game.create(req.user.id, shipId);
      const gameState = await Game.findByUserId(req.user.id);
      
      res.status(201).json({ 
        message: 'Game started successfully',
        gameState: gameState.toJSON()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async travel(req, res) {
    try {
      const { planetId } = req.body;
      
      if (!planetId) {
        return res.status(400).json({ error: 'Planet ID required' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      if (game.currentPlanetId === planetId) {
        return res.status(400).json({ error: 'Already at this planet' });
      }

      await game.travelToPlanet(planetId);
      const updatedGameState = await Game.findByUserId(req.user.id);
      
      res.json({ 
        message: 'Travel successful',
        gameState: updatedGameState.toJSON()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStats(req, res) {
    try {
      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const cargo = await game.getCargo();
      const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
      
      res.json({
        user: { username: req.user.username },
        game: {
          credits: game.credits,
          turnsUsed: game.turnsUsed,
          currentPlanet: game.planetName,
          ship: game.shipName,
          cargoCapacity: game.cargoCapacity,
          totalCargo
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Fuel system endpoints
  static async getFuelInfo(req, res) {
    try {
      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const fuelPercentage = Math.round((game.fuel / game.maxFuel) * 100);
      let fuelStatus = 'adequate';
      if (fuelPercentage === 100) fuelStatus = 'full';
      else if (fuelPercentage < 10) fuelStatus = 'critical';
      else if (fuelPercentage < 25) fuelStatus = 'low';

      // Get reachable planets
      const allPlanets = await Planet.findAll();
      const currentPlanet = await Planet.findById(game.currentPlanetId);
      const reachablePlanets = [];
      
      for (const planet of allPlanets) {
        if (planet.id !== game.currentPlanetId) {
          const fuelCost = currentPlanet.fuelCostTo(planet);
          if (game.fuel >= fuelCost) {
            reachablePlanets.push({
              id: planet.id,
              name: planet.name,
              fuelCost: fuelCost
            });
          }
        }
      }

      res.json({
        currentFuel: game.fuel,
        maxFuel: game.maxFuel,
        fuelPercentage: fuelPercentage,
        fuelStatus: fuelStatus,
        efficiency: {
          fuelPerTurn: 5, // Standard fuel consumption per turn
          averageConsumption: 6.5
        },
        range: {
          reachablePlanets: reachablePlanets,
          maxDistance: Math.floor(game.fuel / 5)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async buyFuel(req, res) {
    try {
      const { planetId, quantity } = req.body;

      // Validate inputs
      if (!planetId || !quantity) {
        return res.status(400).json({ error: 'Planet ID and quantity are required' });
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      // Process fuel purchase - the Game model handles all validation
      const result = await game.purchaseFuel(quantity);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Get updated game state
      const updatedGame = await Game.findByUserId(req.user.id);
      
      // Calculate cost for response
      const planet = await Planet.findById(planetId);
      const fuelPrice = await planet.getFuelPrice();
      const totalCost = quantity * fuelPrice;

      res.json({
        message: `Purchased ${quantity} units of fuel`,
        fuelPurchased: quantity,
        totalCost: totalCost,
        newFuelLevel: updatedGame.fuel,
        gameState: {
          credits: updatedGame.credits,
          fuel: updatedGame.fuel,
          maxFuel: updatedGame.maxFuel
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTravelCost(req, res) {
    try {
      const planetId = parseInt(req.params.planetId);

      if (isNaN(planetId)) {
        return res.status(400).json({ error: 'Invalid planet ID' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const destinationPlanet = await Planet.findById(planetId);
      if (!destinationPlanet) {
        return res.status(404).json({ error: 'Planet not found' });
      }

      const currentPlanet = await Planet.findById(game.currentPlanetId);
      
      // Handle same planet case
      if (planetId === game.currentPlanetId) {
        return res.json({
          destinationPlanetId: planetId,
          fuelCost: 0,
          timeCost: 0,
          canTravel: false,
          remainingFuelAfterTravel: game.fuel,
          message: 'Already at this planet'
        });
      }

      const fuelCost = currentPlanet.fuelCostTo(destinationPlanet);
      const timeCost = currentPlanet.travelTimeTo(destinationPlanet);
      const remainingFuel = game.fuel - fuelCost;
      const canTravel = game.fuel >= fuelCost;

      const response = {
        destinationPlanetId: planetId,
        fuelCost: fuelCost,
        timeCost: timeCost,
        canTravel: canTravel,
        remainingFuelAfterTravel: remainingFuel
      };

      if (!canTravel) {
        response.warning = 'Insufficient fuel for this journey';
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPlanetDetails(req, res) {
    try {
      const planetId = parseInt(req.params.planetId);

      if (isNaN(planetId)) {
        return res.status(400).json({ error: 'Invalid planet ID' });
      }

      const planet = await Planet.findById(planetId);
      if (!planet) {
        return res.status(404).json({ error: 'Planet not found' });
      }

      const fuelPrice = await planet.getFuelPrice();
      const commoditySpecialties = await planet.getCommoditySpecialties();
      
      const response = {
        id: planet.id,
        name: planet.name,
        description: planet.description,
        type: planet.type || 'Unknown',
        classification: planet.classification || 'Standard',
        fuelPrice: fuelPrice,
        economicProfile: {
          primaryIndustries: planet.primaryIndustries || ['Trade'],
          tradeSpecialties: planet.tradeSpecialties || ['General Goods']
        },
        commoditySpecialties: commoditySpecialties
      };

      // Add distance information if user is authenticated
      try {
        if (req.user) {
          const game = await Game.findByUserId(req.user.id);
          if (game) {
            const currentPlanet = await Planet.findById(game.currentPlanetId);
            if (currentPlanet && typeof currentPlanet.distanceTo === 'function') {
              response.distanceFromPlayer = currentPlanet.distanceTo(planet);
            }
          }
        }
      } catch (distanceError) {
        // Distance calculation failed, but don't fail the whole request
        console.warn('Failed to calculate distance:', distanceError.message);
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPlanetDistanceInfo(req, res) {
    try {
      const planetId = parseInt(req.params.planetId);

      if (isNaN(planetId)) {
        return res.status(400).json({ error: 'Invalid planet ID' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const destinationPlanet = await Planet.findById(planetId);
      if (!destinationPlanet) {
        return res.status(404).json({ error: 'Planet not found' });
      }

      const currentPlanet = await Planet.findById(game.currentPlanetId);
      
      // Handle same planet case
      if (planetId === game.currentPlanetId) {
        return res.json({
          planetId: planetId,
          distanceFromPlayer: 0,
          travelTime: 0,
          fuelRequired: 0,
          classification: 'current'
        });
      }

      const distance = currentPlanet.distanceTo(destinationPlanet);
      const travelTime = currentPlanet.travelTimeTo(destinationPlanet);
      const fuelRequired = currentPlanet.fuelCostTo(destinationPlanet);
      
      let classification = 'near';
      if (distance > 8) classification = 'distant';

      res.json({
        planetId: planetId,
        distanceFromPlayer: distance,
        travelTime: travelTime,
        fuelRequired: fuelRequired,
        classification: classification
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
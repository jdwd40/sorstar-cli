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

      // Validate planet exists
      const planet = await Planet.findById(planetId);
      if (!planet) {
        return res.status(400).json({ error: 'Planet not found' });
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
}
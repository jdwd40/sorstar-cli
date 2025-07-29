import { Game } from '../models/Game.js';
import { Planet } from '../models/Planet.js';

export class MarketController {
  static async getMarketPrices(req, res) {
    try {
      const planetId = parseInt(req.params.planetId, 10);
      if (isNaN(planetId)) {
        return res.status(400).json({ error: 'Invalid planet ID' });
      }
      
      const planet = await Planet.findById(planetId);
      if (!planet) {
        return res.status(404).json({ error: 'Planet not found' });
      }

      const marketPrices = await planet.getMarketPrices();
      res.json(marketPrices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCargo(req, res) {
    try {
      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const cargo = await game.getCargo();
      const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
      
      res.json({ 
        cargo,
        totalCargo,
        cargoCapacity: game.cargoCapacity
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async buyCommodity(req, res) {
    try {
      const { commodityId, quantity } = req.body;
      
      if (!commodityId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid commodity ID and quantity required' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const planet = await Planet.findById(game.currentPlanetId);
      const marketPrices = await planet.getMarketPrices();
      const commodity = marketPrices.find(c => c.commodity_id === commodityId);
      
      if (!commodity) {
        return res.status(404).json({ error: 'Commodity not available at this planet' });
      }

      const cargo = await game.getCargo();
      const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = quantity * commodity.buy_price;

      // Validation checks
      if (totalCost > game.credits) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      if (totalCargo + quantity > game.cargoCapacity) {
        return res.status(400).json({ error: 'Insufficient cargo space' });
      }

      if (quantity > commodity.stock) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      await game.buyCommodity(commodityId, quantity, commodity.buy_price);
      const updatedGameState = await Game.findByUserId(req.user.id);
      
      res.json({ 
        message: `Purchased ${quantity} units of ${commodity.commodity_name}`,
        gameState: updatedGameState.toJSON(),
        totalCost 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async sellCommodity(req, res) {
    try {
      const { commodityId, quantity } = req.body;
      
      if (!commodityId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid commodity ID and quantity required' });
      }

      const game = await Game.findByUserId(req.user.id);
      if (!game) {
        return res.status(404).json({ error: 'No game found for user' });
      }

      const cargo = await game.getCargo();
      const cargoItem = cargo.find(c => c.commodity_id === commodityId);
      
      if (!cargoItem || cargoItem.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient cargo to sell' });
      }

      const planet = await Planet.findById(game.currentPlanetId);
      const marketPrices = await planet.getMarketPrices();
      const commodity = marketPrices.find(c => c.commodity_id === commodityId);
      
      if (!commodity) {
        return res.status(404).json({ error: 'Commodity not available at this planet' });
      }

      const totalEarned = quantity * commodity.sell_price;

      await game.sellCommodity(commodityId, quantity, commodity.sell_price);
      const updatedGameState = await Game.findByUserId(req.user.id);
      
      res.json({ 
        message: `Sold ${quantity} units of ${commodity.commodity_name}`,
        gameState: updatedGameState.toJSON(),
        totalEarned 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
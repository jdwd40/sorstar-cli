import { Game } from '../models/Game.js';
import { Planet } from '../models/Planet.js';
import { query } from '../utils/database.js';

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

  static async getPlanetCommodities(req, res) {
    try {
      const planetId = parseInt(req.params.planetId, 10);
      if (isNaN(planetId)) {
        return res.status(400).json({ error: 'Invalid planet ID' });
      }
      
      const planet = await Planet.findById(planetId);
      if (!planet) {
        return res.status(404).json({ error: 'Planet not found' });
      }

      // Get market data with commodity details
      const result = await query(`
        SELECT 
          c.id as commodity_id,
          c.name as commodity_name,
          c.description,
          c.base_price,
          m.buy_price,
          m.sell_price,
          m.stock,
          CASE 
            WHEN m.buy_price < c.base_price * 0.8 THEN 'specialty'
            WHEN m.buy_price < c.base_price * 0.9 THEN 'good'
            WHEN m.buy_price > c.base_price * 1.2 THEN 'expensive'
            ELSE 'average'
          END as price_category
        FROM commodities c
        JOIN markets m ON c.id = m.commodity_id
        WHERE m.planet_id = $1
        ORDER BY c.name
      `, [planetId]);

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCommodityCategories(req, res) {
    try {
      // Get commodity categories with pricing info
      const result = await query(`
        SELECT 
          c.name as commodity_name,
          c.base_price,
          CASE 
            WHEN c.base_price < 100 THEN 'Basic'
            WHEN c.base_price < 300 THEN 'Advanced'
            WHEN c.base_price < 800 THEN 'Rare'
            WHEN c.base_price < 2000 THEN 'Exotic'
            ELSE 'Legendary'
          END as category,
          CASE 
            WHEN c.name IN ('Food', 'Water', 'BioMatter') THEN 'Agricultural'
            WHEN c.name IN ('Metals', 'Titanium', 'Rare Minerals') THEN 'Industrial'
            WHEN c.name IN ('Crystals', 'Dark Matter', 'Neutronium') THEN 'Scientific'
            WHEN c.name IN ('Gas', 'Plasma Fuel', 'Energy Cells') THEN 'Energy'
            WHEN c.name IN ('Synthetic Fibers', 'Silicates', 'Antimatter') THEN 'Technology'
            ELSE 'General'
          END as type
        FROM commodities c
        ORDER BY c.base_price ASC
      `);

      // Group by category
      const categories = result.rows.reduce((acc, commodity) => {
        const { category, type } = commodity;
        if (!acc[category]) {
          acc[category] = {
            name: category,
            type: type,
            commodities: []
          };
        }
        acc[category].commodities.push(commodity);
        return acc;
      }, {});

      res.json(Object.values(categories));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
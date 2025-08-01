import { query, getClient } from '../utils/dbConnection.js';
import { Planet } from './Planet.js';

export class Game {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.shipId = data.ship_id;
    this.currentPlanetId = data.current_planet_id;
    this.credits = data.credits;
    this.turnsUsed = data.turns_used;
    this.fuel = data.fuel || 100;
    this.maxFuel = data.max_fuel || 100;
    this.currentTurn = data.current_turn || 0;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Extended data from joins
    this.shipName = data.ship_name;
    this.cargoCapacity = data.cargo_capacity;
    this.planetName = data.planet_name;
    this.planetDescription = data.planet_description;
  }

  static async findByUserId(userId) {
    const result = await query(`
      SELECT g.*, s.name as ship_name, s.cargo_capacity, p.name as planet_name, p.description as planet_description
      FROM games g
      JOIN ships s ON g.ship_id = s.id
      JOIN planets p ON g.current_planet_id = p.id
      WHERE g.user_id = $1
      ORDER BY g.created_at DESC
      LIMIT 1
    `, [userId]);
    
    return result.rows.length > 0 ? new Game(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await query(`
      SELECT g.*, s.name as ship_name, s.cargo_capacity, p.name as planet_name, p.description as planet_description
      FROM games g
      JOIN ships s ON g.ship_id = s.id
      JOIN planets p ON g.current_planet_id = p.id
      WHERE g.id = $1
    `, [id]);
    
    return result.rows.length > 0 ? new Game(result.rows[0]) : null;
  }

  static async create(userId, shipId) {
    const startingPlanet = await Planet.findByName('Terra Nova');
    
    const result = await query(
      'INSERT INTO games (user_id, ship_id, current_planet_id, credits, fuel, max_fuel, current_turn) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, shipId, startingPlanet.id, 1000, 100, 100, 0]
    );
    
    return new Game(result.rows[0]);
  }

  async travelToPlanet(planetId) {
    await query('UPDATE games SET current_planet_id = $1, turns_used = turns_used + 1 WHERE id = $2', [planetId, this.id]);
    this.currentPlanetId = planetId;
    this.turnsUsed += 1;
  }

  async getCargo() {
    const result = await query(`
      SELECT c.name as commodity_name, ca.quantity, c.id as commodity_id
      FROM cargo ca
      JOIN commodities c ON ca.commodity_id = c.id
      WHERE ca.game_id = $1
      ORDER BY c.name
    `, [this.id]);
    
    return result.rows;
  }

  async buyCommodity(commodityId, quantity, pricePerUnit) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const totalCost = quantity * pricePerUnit;
      
      await client.query('UPDATE games SET credits = credits - $1, turns_used = turns_used + 1 WHERE id = $2', [totalCost, this.id]);
      
      const existingCargo = await client.query('SELECT quantity FROM cargo WHERE game_id = $1 AND commodity_id = $2', [this.id, commodityId]);
      
      if (existingCargo.rows.length > 0) {
        await client.query('UPDATE cargo SET quantity = quantity + $1 WHERE game_id = $2 AND commodity_id = $3', [quantity, this.id, commodityId]);
      } else {
        await client.query('INSERT INTO cargo (game_id, commodity_id, quantity) VALUES ($1, $2, $3)', [this.id, commodityId, quantity]);
      }
      
      const gameResult = await client.query('SELECT current_planet_id, turns_used FROM games WHERE id = $1', [this.id]);
      
      await client.query(`
        INSERT INTO transactions (game_id, planet_id, commodity_id, transaction_type, quantity, price_per_unit, total_cost, turn_number)
        VALUES ($1, $2, $3, 'buy', $4, $5, $6, $7)
      `, [this.id, gameResult.rows[0].current_planet_id, commodityId, quantity, pricePerUnit, totalCost, gameResult.rows[0].turns_used]);
      
      await client.query('COMMIT');
      
      // Update instance state
      this.credits -= totalCost;
      this.turnsUsed += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async sellCommodity(commodityId, quantity, pricePerUnit) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const totalEarned = quantity * pricePerUnit;
      
      await client.query('UPDATE games SET credits = credits + $1, turns_used = turns_used + 1 WHERE id = $2', [totalEarned, this.id]);
      
      await client.query('UPDATE cargo SET quantity = quantity - $1 WHERE game_id = $2 AND commodity_id = $3', [quantity, this.id, commodityId]);
      
      await client.query('DELETE FROM cargo WHERE game_id = $1 AND quantity <= 0', [this.id]);
      
      const gameResult = await client.query('SELECT current_planet_id, turns_used FROM games WHERE id = $1', [this.id]);
      
      await client.query(`
        INSERT INTO transactions (game_id, planet_id, commodity_id, transaction_type, quantity, price_per_unit, total_cost, turn_number)
        VALUES ($1, $2, $3, 'sell', $4, $5, $6, $7)
      `, [this.id, gameResult.rows[0].current_planet_id, commodityId, quantity, pricePerUnit, totalEarned, gameResult.rows[0].turns_used]);
      
      await client.query('COMMIT');
      
      // Update instance state
      this.credits += totalEarned;
      this.turnsUsed += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async consumeFuel(amount) {
    const newFuel = Math.max(0, this.fuel - amount);
    await query('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  async addFuel(amount) {
    const newFuel = Math.min(this.maxFuel, this.fuel + amount);
    await query('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  hasEnoughFuel(amount) {
    return this.fuel >= amount;
  }

  async advanceTurn() {
    const newTurn = this.currentTurn + 1;
    await query('UPDATE games SET current_turn = $1 WHERE id = $2', [newTurn, this.id]);
    this.currentTurn = newTurn;
  }

  async consumeFuelAndAdvanceTurn(fuelAmount) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const newFuel = Math.max(0, this.fuel - fuelAmount);
      const newTurn = this.currentTurn + 1;
      
      await client.query('UPDATE games SET fuel = $1, current_turn = $2 WHERE id = $3', [newFuel, newTurn, this.id]);
      
      await client.query('COMMIT');
      
      // Update instance state
      this.fuel = newFuel;
      this.currentTurn = newTurn;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setFuel(amount) {
    const newFuel = Math.max(0, Math.min(this.maxFuel, amount));
    await query('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  async setCredits(amount) {
    const newCredits = Math.max(0, amount);
    await query('UPDATE games SET credits = $1 WHERE id = $2', [newCredits, this.id]);
    this.credits = newCredits;
  }

  async purchaseFuel(quantity) {
    const currentPlanet = await Planet.findById(this.currentPlanetId);
    const fuelPrice = await currentPlanet.getFuelPrice();
    const totalCost = quantity * fuelPrice;
    
    // Check if player has enough credits
    if (this.credits < totalCost) {
      return {
        success: false,
        error: 'Insufficient credits'
      };
    }
    
    // Check if purchase would exceed fuel capacity
    if (this.fuel + quantity > this.maxFuel) {
      return {
        success: false,
        error: 'Would exceed fuel capacity'
      };
    }
    
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Update game credits and fuel
      const newCredits = this.credits - totalCost;
      const newFuel = this.fuel + quantity;
      
      await client.query('UPDATE games SET credits = $1, fuel = $2 WHERE id = $3', 
        [newCredits, newFuel, this.id]);
      
      // Record transaction
      await client.query(`
        INSERT INTO fuel_transactions (game_id, planet_id, quantity, price_per_unit, total_cost)
        VALUES ($1, $2, $3, $4, $5)
      `, [this.id, this.currentPlanetId, quantity, fuelPrice, totalCost]);
      
      await client.query('COMMIT');
      
      // Update instance state
      this.credits = newCredits;
      this.fuel = newFuel;
      
      return {
        success: true,
        fuelPurchased: quantity,
        pricePerUnit: fuelPrice,
        totalCost: totalCost,
        remainingCredits: newCredits,
        newFuelLevel: newFuel
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getFuelVendorInfo() {
    const currentPlanet = await Planet.findById(this.currentPlanetId);
    const fuelPrice = await currentPlanet.getFuelPrice();
    
    const maxByCredits = Math.floor(this.credits / fuelPrice);
    const maxByCapacity = this.maxFuel - this.fuel;
    const maxPurchasable = Math.min(maxByCredits, maxByCapacity);
    
    return {
      planetName: currentPlanet.name,
      fuelPrice: fuelPrice,
      maxPurchasable: maxPurchasable,
      playerCredits: this.credits,
      currentFuel: this.fuel,
      maxFuel: this.maxFuel
    };
  }

  async getFuelTradingHistory() {
    const result = await query(`
      SELECT ft.*, p.name as planet_name
      FROM fuel_transactions ft
      JOIN planets p ON ft.planet_id = p.id
      WHERE ft.game_id = $1
      ORDER BY ft.created_at DESC
    `, [this.id]);
    
    return result.rows.map(row => ({
      quantity: row.quantity,
      price: row.price_per_unit,
      totalCost: row.total_cost,
      planetName: row.planet_name,
      timestamp: row.created_at
    }));
  }

  async getFuelTradingRecommendations() {
    const allPlanets = await Planet.findAll();
    const currentPlanet = await Planet.findById(this.currentPlanetId);
    const recommendations = [];
    
    for (const planet of allPlanets) {
      if (planet.id === this.currentPlanetId) continue;
      
      const planetPrice = await planet.getFuelPrice();
      const currentPrice = await currentPlanet.getFuelPrice();
      
      if (planetPrice < currentPrice) {
        const travelCost = currentPlanet.fuelCostTo(planet);
        const savings = currentPrice - planetPrice;
        
        recommendations.push({
          planetName: planet.name,
          price: planetPrice,
          savings: savings,
          travelCost: travelCost,
          netSavings: savings - (travelCost * currentPrice)
        });
      }
    }
    
    return recommendations.sort((a, b) => b.netSavings - a.netSavings);
  }

  async travelToPlanet(planetId) {
    const currentPlanet = await Planet.findById(this.currentPlanetId);
    const destinationPlanet = await Planet.findById(planetId);
    
    const fuelCost = currentPlanet.fuelCostTo(destinationPlanet);
    
    if (!this.hasEnoughFuel(fuelCost)) {
      return {
        success: false,
        error: 'Insufficient fuel for travel'
      };
    }
    
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const newFuel = this.fuel - fuelCost;
      const newTurn = this.currentTurn + currentPlanet.travelTimeTo(destinationPlanet);
      
      await client.query('UPDATE games SET current_planet_id = $1, fuel = $2, current_turn = $3, turns_used = turns_used + $4 WHERE id = $5', 
        [planetId, newFuel, newTurn, currentPlanet.travelTimeTo(destinationPlanet), this.id]);
      
      await client.query('COMMIT');
      
      // Update instance state
      this.currentPlanetId = planetId;
      this.fuel = newFuel;
      this.currentTurn = newTurn;
      this.turnsUsed += currentPlanet.travelTimeTo(destinationPlanet);
      
      return {
        success: true,
        fuelConsumed: fuelCost,
        turnsElapsed: currentPlanet.travelTimeTo(destinationPlanet),
        newLocation: destinationPlanet.name
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      shipId: this.shipId,
      currentPlanetId: this.currentPlanetId,
      credits: this.credits,
      turnsUsed: this.turnsUsed,
      fuel: this.fuel,
      maxFuel: this.maxFuel,
      currentTurn: this.currentTurn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      shipName: this.shipName,
      cargoCapacity: this.cargoCapacity,
      planetName: this.planetName,
      planetDescription: this.planetDescription
    };
  }
}
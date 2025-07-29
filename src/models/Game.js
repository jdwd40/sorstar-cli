import { query, getClient } from '../utils/database.js';
import { Planet } from './Planet.js';

export class Game {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.shipId = data.ship_id;
    this.currentPlanetId = data.current_planet_id;
    this.credits = data.credits;
    this.turnsUsed = data.turns_used;
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
      'INSERT INTO games (user_id, ship_id, current_planet_id, credits) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, shipId, startingPlanet.id, 1000]
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

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      shipId: this.shipId,
      currentPlanetId: this.currentPlanetId,
      credits: this.credits,
      turnsUsed: this.turnsUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      shipName: this.shipName,
      cargoCapacity: this.cargoCapacity,
      planetName: this.planetName,
      planetDescription: this.planetDescription
    };
  }
}
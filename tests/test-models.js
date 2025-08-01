import bcrypt from 'bcrypt';
import { testQuery, getTestClient } from '../src/utils/testDatabase.js';

// Test-specific User class that uses test database
export class TestUser {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.password_hash;
    this.createdAt = data.created_at;
  }

  static async findByUsername(username) {
    const result = await testQuery('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? new TestUser(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await testQuery('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? new TestUser(result.rows[0]) : null;
  }

  static async create(username, password) {
    const existingUser = await TestUser.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await testQuery(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, passwordHash]
    );
    
    return new TestUser(result.rows[0]);
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      createdAt: this.createdAt
    };
  }
}

// Test-specific Game class that uses test database
export class TestGame {
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
    const result = await testQuery(`
      SELECT g.*, s.name as ship_name, s.cargo_capacity, p.name as planet_name, p.description as planet_description
      FROM games g
      JOIN ships s ON g.ship_id = s.id
      JOIN planets p ON g.current_planet_id = p.id
      WHERE g.user_id = $1
      ORDER BY g.created_at DESC
      LIMIT 1
    `, [userId]);
    
    return result.rows.length > 0 ? new TestGame(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await testQuery(`
      SELECT g.*, s.name as ship_name, s.cargo_capacity, p.name as planet_name, p.description as planet_description
      FROM games g
      JOIN ships s ON g.ship_id = s.id
      JOIN planets p ON g.current_planet_id = p.id
      WHERE g.id = $1
    `, [id]);
    
    return result.rows.length > 0 ? new TestGame(result.rows[0]) : null;
  }

  static async create(userId, shipId) {
    // Find Terra Nova planet in test database
    const planetResult = await testQuery('SELECT * FROM planets WHERE name = $1', ['Terra Nova']);
    const startingPlanetId = planetResult.rows[0]?.id || 1;
    
    const result = await testQuery(
      'INSERT INTO games (user_id, ship_id, current_planet_id, credits, fuel, max_fuel, current_turn) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, shipId, startingPlanetId, 1000, 100, 100, 0]
    );
    
    return new TestGame(result.rows[0]);
  }

  async travelToPlanet(planetId) {
    await testQuery('UPDATE games SET current_planet_id = $1, turns_used = turns_used + 1 WHERE id = $2', [planetId, this.id]);
    this.currentPlanetId = planetId;
    this.turnsUsed += 1;
  }

  async consumeFuel(amount) {
    const newFuel = Math.max(0, this.fuel - amount);
    await testQuery('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  async addFuel(amount) {
    const newFuel = Math.min(this.maxFuel, this.fuel + amount);
    await testQuery('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  hasEnoughFuel(amount) {
    return this.fuel >= amount;
  }

  async advanceTurn() {
    const newTurn = this.currentTurn + 1;
    await testQuery('UPDATE games SET current_turn = $1 WHERE id = $2', [newTurn, this.id]);
    this.currentTurn = newTurn;
  }

  async consumeFuelAndAdvanceTurn(fuelAmount) {
    const client = await getTestClient();
    
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

// Test-specific Planet class that uses test database
export class TestPlanet {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.xCoord = data.x_coord;
    this.yCoord = data.y_coord;
    this.planetType = data.planet_type;
    this.isDistant = data.is_distant || false;
  }

  static async findAll() {
    const result = await testQuery('SELECT * FROM planets ORDER BY name');
    return result.rows.map(row => new TestPlanet(row));
  }

  static async findById(id) {
    const result = await testQuery('SELECT * FROM planets WHERE id = $1', [id]);
    return result.rows.length > 0 ? new TestPlanet(result.rows[0]) : null;
  }

  static async findByName(name) {
    const result = await testQuery('SELECT * FROM planets WHERE name = $1', [name]);
    return result.rows.length > 0 ? new TestPlanet(result.rows[0]) : null;
  }

  static async getDistantPlanets() {
    const result = await testQuery('SELECT * FROM planets WHERE is_distant = true ORDER BY name');
    return result.rows.map(row => new TestPlanet(row));
  }

  static async getNormalPlanets() {
    const result = await testQuery('SELECT * FROM planets WHERE is_distant = false OR is_distant IS NULL ORDER BY name');
    return result.rows.map(row => new TestPlanet(row));
  }

  distanceTo(otherPlanet) {
    const dx = this.xCoord - otherPlanet.xCoord;
    const dy = this.yCoord - otherPlanet.yCoord;
    return Math.sqrt(dx * dx + dy * dy);
  }

  travelTimeTo(otherPlanet) {
    return Math.ceil(this.distanceTo(otherPlanet) / 10); // 10 units per turn
  }

  fuelCostTo(otherPlanet) {
    return this.travelTimeTo(otherPlanet) * 5; // 5 fuel per turn
  }

  getTravelInfo(otherPlanet) {
    const distance = this.distanceTo(otherPlanet);
    const travelTime = this.travelTimeTo(otherPlanet);
    const fuelCost = this.fuelCostTo(otherPlanet);
    
    return {
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      travelTime,
      fuelCost,
      destinationPlanet: otherPlanet.toJSON()
    };
  }

  async getMarketPrices() {
    const result = await testQuery(`
      SELECT c.name as commodity_name, m.buy_price, m.sell_price, m.stock, c.id as commodity_id
      FROM markets m
      JOIN commodities c ON m.commodity_id = c.id
      WHERE m.planet_id = $1
      ORDER BY c.name
    `, [this.id]);
    
    return result.rows;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      xCoord: this.xCoord,
      yCoord: this.yCoord,
      planetType: this.planetType,
      isDistant: this.isDistant
    };
  }
}
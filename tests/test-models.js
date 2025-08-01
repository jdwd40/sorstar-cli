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

  async setFuel(amount) {
    const newFuel = Math.max(0, Math.min(this.maxFuel, amount));
    await testQuery('UPDATE games SET fuel = $1 WHERE id = $2', [newFuel, this.id]);
    this.fuel = newFuel;
  }

  async setCredits(amount) {
    const newCredits = Math.max(0, amount);
    await testQuery('UPDATE games SET credits = $1 WHERE id = $2', [newCredits, this.id]);
    this.credits = newCredits;
  }

  async purchaseFuel(quantity) {
    const currentPlanet = await TestPlanet.findById(this.currentPlanetId);
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
    
    const client = await getTestClient();
    
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
    const currentPlanet = await TestPlanet.findById(this.currentPlanetId);
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
    const result = await testQuery(`
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
    const allPlanets = await TestPlanet.findAll();
    const currentPlanet = await TestPlanet.findById(this.currentPlanetId);
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
    const currentPlanet = await TestPlanet.findById(this.currentPlanetId);
    const destinationPlanet = await TestPlanet.findById(planetId);
    
    const fuelCost = currentPlanet.fuelCostTo(destinationPlanet);
    
    if (!this.hasEnoughFuel(fuelCost)) {
      return {
        success: false,
        error: 'Insufficient fuel for travel'
      };
    }
    
    const client = await getTestClient();
    
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

  async toJSONWithFuelPrice() {
    const currentPlanet = await TestPlanet.findById(this.currentPlanetId);
    const fuelPrice = await currentPlanet.getFuelPrice();
    
    return {
      ...this.toJSON(),
      currentPlanetFuelPrice: fuelPrice
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

  // Planet Classification System methods
  static getValidPlanetTypes() {
    return ['Forest', 'Jungle', 'Industrial', 'City', 'Mining', 'Agricultural', 'Colony', 'Trade Hub', 'Research', 'Military'];
  }

  isValidPlanetType(type) {
    return TestPlanet.getValidPlanetTypes().includes(type);
  }

  getValidPlanetTypes() {
    return TestPlanet.getValidPlanetTypes();
  }

  async setPlanetType(type) {
    if (type !== null && !this.isValidPlanetType(type)) {
      throw new Error('Invalid planet type');
    }
    
    await testQuery('UPDATE planets SET planet_type = $1 WHERE id = $2', [type, this.id]);
    this.planetType = type;
  }

  getTypeBasedDescription() {
    if (!this.planetType) {
      return 'A mysterious world with unknown characteristics.';
    }

    const descriptions = {
      'Forest': 'Dense woodlands cover this planet, with towering trees and rich biodiversity.',
      'Jungle': 'Thick tropical vegetation dominates this humid world with exotic wildlife.',
      'Industrial': 'Massive factories and manufacturing facilities define this industrial powerhouse.',
      'City': 'Urban sprawl extends across continents on this heavily populated metropolitan world.',
      'Mining': 'Rich mineral deposits make this a vital source of raw materials and ore.',
      'Agricultural': 'Fertile farmlands and agricultural facilities feed nearby systems.',
      'Colony': 'A growing settlement representing the expansion of civilization into new frontiers.',
      'Trade Hub': 'Bustling spaceports and markets make this a center of interstellar commerce.',
      'Research': 'Advanced laboratories and research facilities push the boundaries of science.',
      'Military': 'Strategic defense installations and military bases secure this sector.'
    };

    return descriptions[this.planetType] || 'A unique world with special characteristics.';
  }

  getRandomTypeDescription(type) {
    const descriptionVariants = {
      'Forest': [
        'Dense woodlands cover this planet, with towering trees and rich biodiversity.',
        'Ancient forests stretch across continents, home to countless species.',
        'Pristine wilderness dominates this green world of endless forests.'
      ],
      'Mining': [
        'Rich mineral deposits make this a vital source of raw materials and ore.',
        'Extensive mining operations extract valuable resources from deep caverns.',
        'Industrial mining complexes dot the landscape of this resource-rich world.'
      ]
    };

    const variants = descriptionVariants[type] || [this.getTypeBasedDescription()];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  getFullDescription() {
    const baseDesc = this.description || '';
    const typeDesc = this.getTypeBasedDescription();
    return `${baseDesc} ${typeDesc}`.trim();
  }

  getPlanetInfo() {
    return {
      id: this.id,
      name: this.name,
      planetType: this.planetType,
      baseDescription: this.description,
      typeDescription: this.getTypeBasedDescription(),
      fullDescription: this.getFullDescription(),
      coordinates: {
        x: this.xCoord,
        y: this.yCoord,
        formatted: `(${this.xCoord}, ${this.yCoord})`
      },
      isDistant: this.isDistant,
      specialCharacteristics: this.isDistant ? ['Remote location', 'Lower fuel costs'] : []
    };
  }

  static async findByType(type) {
    const result = await testQuery('SELECT * FROM planets WHERE planet_type = $1 ORDER BY name', [type]);
    return result.rows.map(row => new TestPlanet(row));
  }

  static async findByTypes(types) {
    const placeholders = types.map((_, i) => `$${i + 1}`).join(',');
    const result = await testQuery(`SELECT * FROM planets WHERE planet_type IN (${placeholders}) ORDER BY name`, types);
    return result.rows.map(row => new TestPlanet(row));
  }

  static async findPlanetsForActivity(activity) {
    const activityToPlanetTypes = {
      'trading': ['Trade Hub', 'City', 'Industrial'],
      'mining': ['Mining', 'Industrial'],
      'research': ['Research', 'City'],
      'agriculture': ['Agricultural', 'Colony']
    };

    const relevantTypes = activityToPlanetTypes[activity] || [];
    if (relevantTypes.length === 0) return [];

    return await this.findByTypes(relevantTypes);
  }

  static async getGroupedByType() {
    const allPlanets = await this.findAll();
    const grouped = {};

    for (const planet of allPlanets) {
      const type = planet.planetType || 'Unclassified';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(planet);
    }

    return grouped;
  }

  static async getPlanetTypeStatistics() {
    const result = await testQuery(`
      SELECT planet_type, COUNT(*) as count 
      FROM planets 
      GROUP BY planet_type 
      ORDER BY count DESC
    `);

    const totalResult = await testQuery('SELECT COUNT(*) as total FROM planets');
    const totalPlanets = parseInt(totalResult.rows[0].total);

    const typeBreakdown = {};
    for (const row of result.rows) {
      const type = row.planet_type || 'Unclassified';
      typeBreakdown[type] = parseInt(row.count);
    }

    return {
      totalPlanets,
      typeBreakdown
    };
  }

  static async getRecommendationsForActivity(activity) {
    const suitablePlanets = await this.findPlanetsForActivity(activity);
    
    // Add additional scoring/filtering logic here if needed
    return suitablePlanets.map(planet => ({
      ...planet.getPlanetInfo(),
      recommendationScore: this.calculateRecommendationScore(planet, activity)
    })).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  static calculateRecommendationScore(planet, activity) {
    let score = 50; // Base score

    // Adjust based on planet type relevance
    const typeScores = {
      'trading': { 'Trade Hub': 100, 'City': 80, 'Industrial': 60 },
      'mining': { 'Mining': 100, 'Industrial': 70 },
      'research': { 'Research': 100, 'City': 60 },
      'agriculture': { 'Agricultural': 100, 'Colony': 70 }
    };

    const activityScores = typeScores[activity] || {};
    score = activityScores[planet.planetType] || score;

    // Reduce score for distant planets (harder to reach)
    if (planet.isDistant) {
      score *= 0.8;
    }

    return score;
  }

  // Fuel Trading Methods
  async getFuelPrice() {
    const basePrice = 5.0; // Base fuel price
    let planetTypeModifier = 1.0;
    let distanceModifier = 1.0;
    
    // Planet type pricing modifiers
    const typeModifiers = {
      'Trade Hub': 0.8,    // 20% discount - competitive pricing
      'Agricultural': 0.9, // 10% discount - local production
      'Colony': 0.85,      // 15% discount - simple economy
      'Mining': 1.2,       // 20% markup - industrial demand
      'Industrial': 1.15,  // 15% markup - heavy fuel use
      'Research': 1.1,     // 10% markup - specialized facilities
      'City': 1.05,        // 5% markup - urban convenience
      'Military': 1.25,    // 25% markup - restricted access
      'Forest': 0.95,      // 5% discount - natural resources
      'Jungle': 0.9        // 10% discount - isolation
    };
    
    if (this.planetType && typeModifiers[this.planetType]) {
      planetTypeModifier = typeModifiers[this.planetType];
    }
    
    // Distance modifier - distant planets have cheaper fuel
    if (this.isDistant) {
      distanceModifier = 0.7; // 30% discount for distant planets
    }
    
    const finalPrice = basePrice * planetTypeModifier * distanceModifier;
    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  }

  async getFuelMarketInfo() {
    const price = await this.getFuelPrice();
    
    return {
      price: price,
      availability: 'Available',
      planetName: this.name,
      planetType: this.planetType || 'Unknown',
      discount: this.isDistant ? 'Distance discount applied' : null
    };
  }

  async calculateFuelCost(quantity) {
    const pricePerUnit = await this.getFuelPrice();
    
    return {
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      totalCost: quantity * pricePerUnit
    };
  }

  async getFuelPricingFactors() {
    const basePrice = 5.0;
    const priceModifiers = {
      'Trade Hub': 0.8,
      'Agricultural': 0.9,
      'Colony': 0.85,
      'Mining': 1.2,
      'Industrial': 1.15,
      'Research': 1.1,
      'City': 1.05,
      'Military': 1.25,
      'Forest': 0.95,
      'Jungle': 0.9
    };
    
    const planetTypeModifier = (this.planetType && priceModifiers[this.planetType]) ? priceModifiers[this.planetType] : 1.0;
    const distanceModifier = this.isDistant ? 0.7 : 1.0;
    const finalPrice = basePrice * planetTypeModifier * distanceModifier;
    
    return {
      basePrice: basePrice,
      planetTypeModifier: planetTypeModifier,
      distanceModifier: distanceModifier,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
  }

  static async getFuelPriceComparison() {
    const planets = await TestPlanet.findAll();
    const prices = [];
    
    for (const planet of planets) {
      const price = await planet.getFuelPrice();
      prices.push({
        planetName: planet.name,
        price: price,
        planetType: planet.planetType,
        isDistant: planet.isDistant
      });
    }
    
    prices.sort((a, b) => a.price - b.price);
    
    const cheapest = prices[0];
    const mostExpensive = prices[prices.length - 1];
    const average = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const priceRange = mostExpensive.price - cheapest.price;
    
    return {
      cheapest,
      mostExpensive,
      average: Math.round(average * 100) / 100,
      priceRange: Math.round(priceRange * 100) / 100
    };
  }

  static async getFuelPriceTrendsByType() {
    const planets = await TestPlanet.findAll();
    const trends = {};
    
    for (const planet of planets) {
      const type = planet.planetType || 'Unknown';
      const price = await planet.getFuelPrice();
      
      if (!trends[type]) {
        trends[type] = {
          prices: [],
          planetCount: 0
        };
      }
      
      trends[type].prices.push(price);
      trends[type].planetCount++;
    }
    
    // Calculate averages
    for (const [type, data] of Object.entries(trends)) {
      const average = data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length;
      trends[type].averagePrice = Math.round(average * 100) / 100;
      delete trends[type].prices; // Remove raw prices array
    }
    
    return trends;
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
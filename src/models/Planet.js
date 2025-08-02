import { query } from '../utils/dbConnection.js';

export class Planet {
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
    const result = await query('SELECT * FROM planets ORDER BY name');
    return result.rows.map(row => new Planet(row));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM planets WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Planet(result.rows[0]) : null;
  }

  static async findByName(name) {
    const result = await query('SELECT * FROM planets WHERE name = $1', [name]);
    return result.rows.length > 0 ? new Planet(result.rows[0]) : null;
  }

  static async getDistantPlanets() {
    const result = await query('SELECT * FROM planets WHERE is_distant = true ORDER BY name');
    return result.rows.map(row => new Planet(row));
  }

  static async getNormalPlanets() {
    const result = await query('SELECT * FROM planets WHERE is_distant = false OR is_distant IS NULL ORDER BY name');
    return result.rows.map(row => new Planet(row));
  }

  async getMarketPrices() {
    const result = await query(`
      SELECT c.name as commodity_name, m.buy_price, m.sell_price, m.stock, c.id as commodity_id
      FROM markets m
      JOIN commodities c ON m.commodity_id = c.id
      WHERE m.planet_id = $1
      ORDER BY c.name
    `, [this.id]);
    
    return result.rows;
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

  // Planet Classification System methods
  static getValidPlanetTypes() {
    return ['Forest', 'Jungle', 'Industrial', 'City', 'Mining', 'Agricultural', 'Colony', 'Trade Hub', 'Research', 'Military'];
  }

  isValidPlanetType(type) {
    return Planet.getValidPlanetTypes().includes(type);
  }

  getValidPlanetTypes() {
    return Planet.getValidPlanetTypes();
  }

  async setPlanetType(type) {
    if (type !== null && !this.isValidPlanetType(type)) {
      throw new Error('Invalid planet type');
    }
    
    await query('UPDATE planets SET planet_type = $1 WHERE id = $2', [type, this.id]);
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
    const result = await query('SELECT * FROM planets WHERE planet_type = $1 ORDER BY name', [type]);
    return result.rows.map(row => new Planet(row));
  }

  static async findByTypes(types) {
    const placeholders = types.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`SELECT * FROM planets WHERE planet_type IN (${placeholders}) ORDER BY name`, types);
    return result.rows.map(row => new Planet(row));
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
    const result = await query(`
      SELECT planet_type, COUNT(*) as count 
      FROM planets 
      GROUP BY planet_type 
      ORDER BY count DESC
    `);

    const totalResult = await query('SELECT COUNT(*) as total FROM planets');
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
    const planets = await Planet.findAll();
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
    const planets = await Planet.findAll();
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

  async getCommoditySpecialties() {
    // Return commodity specialties based on planet type
    const specialties = {
      'Forest': ['Food', 'Bio-Materials', 'Oxygen'],
      'Jungle': ['Exotic Foods', 'Medicines', 'Bio-Tech'],
      'Industrial': ['Metals', 'Machinery', 'Electronics'],
      'City': ['Consumer Goods', 'Services', 'Information'],
      'Mining': ['Raw Materials', 'Minerals', 'Fuel'],
      'Agricultural': ['Food Supplies', 'Seeds', 'Livestock']
    };

    return specialties[this.planetType || 'City'] || ['General Goods'];
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
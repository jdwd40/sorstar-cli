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
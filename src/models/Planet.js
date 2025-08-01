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
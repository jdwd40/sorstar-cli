import { query } from '../utils/database.js';

export class Planet {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.xCoord = data.x_coord;
    this.yCoord = data.y_coord;
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

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      xCoord: this.xCoord,
      yCoord: this.yCoord
    };
  }
}
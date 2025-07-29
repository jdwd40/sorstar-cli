import { query } from '../utils/database.js';

export class Commodity {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.basePrice = data.base_price;
    this.description = data.description;
  }

  static async findAll() {
    const result = await query('SELECT * FROM commodities ORDER BY name');
    return result.rows.map(row => new Commodity(row));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM commodities WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Commodity(result.rows[0]) : null;
  }

  static async findByName(name) {
    const result = await query('SELECT * FROM commodities WHERE name = $1', [name]);
    return result.rows.length > 0 ? new Commodity(result.rows[0]) : null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      basePrice: this.basePrice,
      description: this.description
    };
  }
}
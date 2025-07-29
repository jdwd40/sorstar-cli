import { query } from '../utils/dbConnection.js';

export class Ship {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.cargoCapacity = data.cargo_capacity;
    this.cost = data.cost;
    this.description = data.description;
  }

  static async findAll() {
    const result = await query('SELECT * FROM ships ORDER BY cost');
    return result.rows.map(row => new Ship(row));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM ships WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Ship(result.rows[0]) : null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      cargoCapacity: this.cargoCapacity,
      cost: this.cost,
      description: this.description
    };
  }
}
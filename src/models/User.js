import bcrypt from 'bcrypt';
import { query } from '../utils/dbConnection.js';

export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.password_hash;
    this.createdAt = data.created_at;
  }

  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  static async create(username, password) {
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, passwordHash]
    );
    
    return new User(result.rows[0]);
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
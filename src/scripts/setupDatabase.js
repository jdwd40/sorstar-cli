import { query } from '../utils/database.js';

const setupTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ships (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        cargo_capacity INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        description TEXT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS planets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        x_coord INTEGER,
        y_coord INTEGER
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS commodities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        base_price INTEGER NOT NULL,
        description TEXT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS markets (
        id SERIAL PRIMARY KEY,
        planet_id INTEGER REFERENCES planets(id),
        commodity_id INTEGER REFERENCES commodities(id),
        buy_price INTEGER NOT NULL,
        sell_price INTEGER NOT NULL,
        stock INTEGER DEFAULT 100,
        UNIQUE(planet_id, commodity_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        ship_id INTEGER REFERENCES ships(id),
        current_planet_id INTEGER REFERENCES planets(id),
        credits INTEGER DEFAULT 1000,
        turns_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS cargo (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        quantity INTEGER NOT NULL,
        UNIQUE(game_id, commodity_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        planet_id INTEGER REFERENCES planets(id),
        commodity_id INTEGER REFERENCES commodities(id),
        transaction_type VARCHAR(10) CHECK (transaction_type IN ('buy', 'sell')),
        quantity INTEGER NOT NULL,
        price_per_unit INTEGER NOT NULL,
        total_cost INTEGER NOT NULL,
        turn_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables created successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
};

setupTables();
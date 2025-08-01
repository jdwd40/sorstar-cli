import { testQuery } from '../utils/testDatabase.js';

const setupTestTables = async () => {
  try {
    console.log('Setting up test database tables...');
    
    await testQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await testQuery(`
      CREATE TABLE IF NOT EXISTS ships (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        cargo_capacity INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        description TEXT
      );
    `);

    await testQuery(`
      CREATE TABLE IF NOT EXISTS planets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        x_coord INTEGER,
        y_coord INTEGER
      );
    `);

    await testQuery(`
      CREATE TABLE IF NOT EXISTS commodities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        base_price INTEGER NOT NULL,
        description TEXT
      );
    `);

    await testQuery(`
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

    await testQuery(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        ship_id INTEGER REFERENCES ships(id),
        current_planet_id INTEGER REFERENCES planets(id),
        credits INTEGER DEFAULT 1000,
        turns_used INTEGER DEFAULT 0,
        fuel INTEGER DEFAULT 100,
        max_fuel INTEGER DEFAULT 100,
        current_turn INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add columns if they don't exist (for existing tables)
    await testQuery(`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS fuel INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS max_fuel INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS current_turn INTEGER DEFAULT 0;
    `);

    await testQuery(`
      CREATE TABLE IF NOT EXISTS cargo (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        quantity INTEGER NOT NULL,
        UNIQUE(game_id, commodity_id)
      );
    `);

    await testQuery(`
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

    // Create commodity_transactions table for enhanced commodity system
    await testQuery(`
      CREATE TABLE IF NOT EXISTS commodity_transactions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        planet_id INTEGER REFERENCES planets(id),
        commodity_id INTEGER REFERENCES commodities(id),
        transaction_type VARCHAR(20) NOT NULL, -- 'buy' or 'sell'
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Test database tables created successfully!');
  } catch (err) {
    console.error('Error setting up test database:', err);
    process.exit(1);
  }
};

const seedTestData = async () => {
  try {
    console.log('Seeding test database...');
    
    // Add ships
    await testQuery(`
      INSERT INTO ships (name, cargo_capacity, cost, description) VALUES
      ('Light Freighter', 50, 10000, 'A small, nimble cargo ship perfect for new traders'),
      ('Heavy Hauler', 150, 25000, 'A large cargo vessel for serious trading operations'),
      ('Swift Runner', 75, 15000, 'Balanced ship with good speed and cargo capacity')
      ON CONFLICT DO NOTHING;
    `);

    // Add planets
    await testQuery(`
      INSERT INTO planets (name, description, x_coord, y_coord) VALUES
      ('Terra Nova', 'A bustling trade hub and starting point for new traders', 0, 0),
      ('Mining Station Alpha', 'Industrial mining outpost rich in raw materials', 100, 50),
      ('Agricultural World Ceres', 'Farming planet known for food production', -75, 80),
      ('Tech Haven Beta', 'High-tech research facility with advanced equipment', 150, -60)
      ON CONFLICT DO NOTHING;
    `);

    // Add commodities
    await testQuery(`
      INSERT INTO commodities (name, base_price, description) VALUES
      ('Food', 10, 'Essential sustenance for space travelers'),
      ('Water', 5, 'Pure H2O, vital for life support systems'),
      ('Electronics', 100, 'Advanced computer components and circuits'),
      ('Metals', 25, 'Raw metals used in construction and manufacturing'),
      ('Fuel', 15, 'Starship fuel for interplanetary travel'),
      ('Medicine', 75, 'Medical supplies and pharmaceuticals')
      ON CONFLICT DO NOTHING;
    `);

    // Add market data
    const marketData = [
      [1, 1, 12, 8], [1, 2, 6, 4], [1, 3, 90, 110], [1, 4, 30, 20], [1, 5, 18, 12], [1, 6, 80, 70],
      [2, 1, 15, 10], [2, 2, 8, 5], [2, 3, 95, 105], [2, 4, 20, 35], [2, 5, 12, 18], [2, 6, 85, 65],
      [3, 1, 8, 15], [3, 2, 4, 8], [3, 3, 110, 85], [3, 4, 35, 25], [3, 5, 20, 14], [3, 6, 70, 80],
      [4, 1, 14, 11], [4, 2, 7, 6], [4, 3, 80, 120], [4, 4, 28, 22], [4, 5, 16, 13], [4, 6, 65, 85]
    ];

    for (const [planetId, commodityId, buyPrice, sellPrice] of marketData) {
      await testQuery(`
        INSERT INTO markets (planet_id, commodity_id, buy_price, sell_price, stock)
        VALUES ($1, $2, $3, $4, 100)
        ON CONFLICT (planet_id, commodity_id) DO NOTHING;
      `, [planetId, commodityId, buyPrice, sellPrice]);
    }

    console.log('Test database seeded successfully!');
  } catch (err) {
    console.error('Error seeding test database:', err);
    process.exit(1);
  }
};

const setupTestDatabase = async () => {
  await setupTestTables();
  await seedTestData();
  process.exit(0);
};

setupTestDatabase();
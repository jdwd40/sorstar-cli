import { testQuery } from './src/utils/testDatabase.js';

const createCommoditiesTables = async () => {
  try {
    console.log('Creating commodity system tables in test database...');
    
    // Add category column to commodities table
    await testQuery(`
      ALTER TABLE commodities 
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Unknown'
    `);
    console.log('✅ Added category column to commodities table');
    
    // Create commodity_transactions table
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
      )
    `);
    console.log('✅ Created commodity_transactions table');
    
    // Create futures_contracts table
    await testQuery(`
      CREATE TABLE IF NOT EXISTS futures_contracts (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        quantity INTEGER NOT NULL,
        agreed_price DECIMAL(10,2) NOT NULL,
        delivery_turn INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Fulfilled', 'Expired'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created futures_contracts table');
    
    // Create price_alerts table
    await testQuery(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        planet_id INTEGER REFERENCES planets(id),
        alert_type VARCHAR(20) NOT NULL, -- 'above', 'below'
        target_price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created price_alerts table');
    
    // Create commodity_missions table
    await testQuery(`
      CREATE TABLE IF NOT EXISTS commodity_missions (
        id SERIAL PRIMARY KEY,
        commodity_id INTEGER REFERENCES commodities(id),
        mission_type VARCHAR(50) NOT NULL,
        quantity_required INTEGER NOT NULL,
        reward_credits INTEGER NOT NULL,
        deadline_turn INTEGER NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created commodity_missions table');
    
    // Update commodities with categories
    const commodityUpdates = [
      ['Food', 'Essential'],
      ['Water', 'Essential'],
      ['Medicine', 'Essential'],
      ['Electronics', 'Industrial'],
      ['Metals', 'Industrial'],
      ['Fuel', 'Energy']
    ];
    
    for (const [name, category] of commodityUpdates) {
      await testQuery(
        'UPDATE commodities SET category = $1 WHERE name = $2',
        [category, name]
      );
    }
    console.log('✅ Updated commodity categories');
    
    // Also create tables in main database
    const { query } = await import('./src/utils/database.js');
    
    await query(`
      ALTER TABLE commodities 
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Unknown'
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS commodity_transactions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        planet_id INTEGER REFERENCES planets(id),
        commodity_id INTEGER REFERENCES commodities(id),
        transaction_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS futures_contracts (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        quantity INTEGER NOT NULL,
        agreed_price DECIMAL(10,2) NOT NULL,
        delivery_turn INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        commodity_id INTEGER REFERENCES commodities(id),
        planet_id INTEGER REFERENCES planets(id),
        alert_type VARCHAR(20) NOT NULL,
        target_price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS commodity_missions (
        id SERIAL PRIMARY KEY,
        commodity_id INTEGER REFERENCES commodities(id),
        mission_type VARCHAR(50) NOT NULL,
        quantity_required INTEGER NOT NULL,
        reward_credits INTEGER NOT NULL,
        deadline_turn INTEGER NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    for (const [name, category] of commodityUpdates) {
      await query(
        'UPDATE commodities SET category = $1 WHERE name = $2',
        [category, name]
      );
    }
    
    console.log('✅ Created all commodity system tables in main database too!');
    
  } catch (err) {
    console.error('Error creating commodity system tables:', err);
  }
  process.exit(0);
};

createCommoditiesTables();
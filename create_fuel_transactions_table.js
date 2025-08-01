import { testQuery } from './src/utils/testDatabase.js';

const createFuelTransactionsTable = async () => {
  try {
    console.log('Creating fuel_transactions table in test database...');
    
    await testQuery(`
      CREATE TABLE IF NOT EXISTS fuel_transactions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        planet_id INTEGER REFERENCES planets(id),
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        transaction_type VARCHAR(20) DEFAULT 'purchase',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ fuel_transactions table created successfully!');
    
    // Also create it in the main database
    const { query } = await import('./src/utils/database.js');
    await query(`
      CREATE TABLE IF NOT EXISTS fuel_transactions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        planet_id INTEGER REFERENCES planets(id),
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        transaction_type VARCHAR(20) DEFAULT 'purchase',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ fuel_transactions table created in main database too!');
    
  } catch (err) {
    console.error('Error creating fuel_transactions table:', err);
  }
  process.exit(0);
};

createFuelTransactionsTable();
import { testQuery } from './src/utils/testDatabase.js';

const checkCommodities = async () => {
  try {
    console.log('Checking existing commodities structure...');
    
    const commodities = await testQuery('SELECT * FROM commodities LIMIT 10');
    console.log('Commodities:', commodities.rows);
    
    const markets = await testQuery('SELECT * FROM markets LIMIT 10');
    console.log('Markets:', markets.rows);
    
    // Check table structure
    const commodityColumns = await testQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'commodities' 
      ORDER BY ordinal_position
    `);
    console.log('Commodity table structure:', commodityColumns.rows);
    
  } catch (err) {
    console.error('Error checking commodities:', err);
  }
  process.exit(0);
};

checkCommodities();
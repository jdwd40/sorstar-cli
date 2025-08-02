import { testQuery } from './src/utils/testDatabase.js';

const addDistanceColumn = async () => {
  try {
    console.log('Adding distance column to planets table...');
    
    // Add distance column if it doesn't exist
    await testQuery(`
      ALTER TABLE planets 
      ADD COLUMN IF NOT EXISTS distance INTEGER DEFAULT 6
    `);
    
    // Update some planets with different distances
    await testQuery(`
      UPDATE planets 
      SET distance = CASE 
        WHEN name LIKE '%Alpha%' OR name LIKE '%Beta%' THEN 10
        WHEN name LIKE '%Mining%' THEN 8
        ELSE 6
      END
    `);
    
    console.log('✅ Distance column added and populated');
    
  } catch (err) {
    console.error('Error adding distance column:', err);
  }
  process.exit(0);
};

addDistanceColumn();
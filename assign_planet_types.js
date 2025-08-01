import { testQuery } from './src/utils/testDatabase.js';
import { query } from './src/utils/database.js';

const assignPlanetTypes = async () => {
  try {
    console.log('Assigning appropriate planet types to existing planets...');
    
    const planetTypeAssignments = [
      ['Terra Nova', 'Trade Hub'],           // Starting hub, center of commerce
      ['Mining Station Alpha', 'Mining'],    // Industrial mining outpost  
      ['Agricultural World Ceres', 'Agricultural'], // Farming planet
      ['Tech Haven Beta', 'Research'],       // High-tech research facility
      ['Outer Rim Station', 'Mining'],       // Remote mining outpost (distant)
      ['Deep Space Colony', 'Colony']        // Isolated colony (distant)
    ];

    // Update test database
    console.log('Updating test database...');
    for (const [planetName, planetType] of planetTypeAssignments) {
      await testQuery(`
        UPDATE planets 
        SET planet_type = $1 
        WHERE name = $2
      `, [planetType, planetName]);
      console.log(`  ✓ ${planetName} → ${planetType}`);
    }

    // Update main database
    console.log('Updating main database...');
    for (const [planetName, planetType] of planetTypeAssignments) {
      await query(`
        UPDATE planets 
        SET planet_type = $1 
        WHERE name = $2
      `, [planetType, planetName]);
      console.log(`  ✓ ${planetName} → ${planetType}`);
    }

    console.log('Planet type assignments completed successfully!');
    
    // Show final status
    console.log('\nFinal planet type assignments:');
    const testResult = await testQuery('SELECT name, planet_type, is_distant FROM planets ORDER BY name');
    console.table(testResult.rows);

  } catch (err) {
    console.error('Error assigning planet types:', err);
  }
  process.exit(0);
};

assignPlanetTypes();
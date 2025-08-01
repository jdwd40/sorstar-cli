import { testQuery } from './src/utils/testDatabase.js';

const createSampleMissions = async () => {
  try {
    console.log('Creating sample commodity missions...');
    
    const missions = [
      {
        commodity_name: 'Food',
        mission_type: 'Delivery',
        quantity_required: 50,
        reward_credits: 1000,
        deadline_turn: 100,
        description: 'Deliver emergency food supplies to the outer colonies'
      },
      {
        commodity_name: 'Medicine',
        mission_type: 'Urgent Delivery',
        quantity_required: 25,
        reward_credits: 1500,
        deadline_turn: 50,
        description: 'Critical medical supplies needed for outbreak response'
      },
      {
        commodity_name: 'Electronics',
        mission_type: 'Trade Contract',
        quantity_required: 15,
        reward_credits: 800,
        deadline_turn: 75,
        description: 'Supply electronics for infrastructure development'  
      }
    ];
    
    for (const mission of missions) {
      // Get commodity ID
      const commodity = await testQuery('SELECT id FROM commodities WHERE name = $1', [mission.commodity_name]);
      if (commodity.rows.length > 0) {
        await testQuery(`
          INSERT INTO commodity_missions (commodity_id, mission_type, quantity_required, reward_credits, deadline_turn, description)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          commodity.rows[0].id,
          mission.mission_type,
          mission.quantity_required,
          mission.reward_credits,
          mission.deadline_turn,
          mission.description
        ]);
        console.log(`✅ Created mission for ${mission.commodity_name}`);
      }
    }
    
    // Also create in main database
    const { query } = await import('./src/utils/database.js');
    
    for (const mission of missions) {
      const commodity = await query('SELECT id FROM commodities WHERE name = $1', [mission.commodity_name]);
      if (commodity.rows.length > 0) {
        await query(`
          INSERT INTO commodity_missions (commodity_id, mission_type, quantity_required, reward_credits, deadline_turn, description)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          commodity.rows[0].id,
          mission.mission_type,
          mission.quantity_required,
          mission.reward_credits,
          mission.deadline_turn,
          mission.description
        ]);
      }
    }
    
    console.log('✅ Sample missions created in both databases!');
    
  } catch (err) {
    console.error('Error creating sample missions:', err);
  }
  process.exit(0);
};

createSampleMissions();
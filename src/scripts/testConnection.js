import { query } from '../utils/database.js';

const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    console.log(`PostgreSQL version: ${result.rows[0].postgres_version}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
};

testConnection();
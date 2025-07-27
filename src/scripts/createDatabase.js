import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const createDatabase = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'jd',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'K1ller1921',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    const dbName = process.env.DB_NAME || 'sorstar';
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully!`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Database already exists');
    } else {
      console.error('❌ Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
};

createDatabase();
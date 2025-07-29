import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const testPool = new Pool({
  user: process.env.DB_USER || 'jd',
  host: process.env.DB_HOST || 'localhost',
  database: 'sorstar_test',
  password: process.env.DB_PASSWORD || 'K1ller1921',
  port: process.env.DB_PORT || 5432,
});

export const testQuery = (text, params) => testPool.query(text, params);

export const getTestClient = () => testPool.connect();

export default testPool;
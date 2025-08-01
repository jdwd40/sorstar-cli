import { testQuery, getTestClient } from '../src/utils/testDatabase.js';
import testPool from '../src/utils/testDatabase.js';

// Test database setup and cleanup - ONLY affects sorstar_test database
const setupTestDatabase = async () => {
  console.log('🧪 Setting up test database (sorstar_test)...');
  // Clean up all tables for testing in TEST DATABASE ONLY
  await testQuery('DELETE FROM transactions');
  await testQuery('DELETE FROM cargo');
  await testQuery('DELETE FROM games');
  await testQuery('DELETE FROM users');
  
  // Reset sequences in TEST DATABASE ONLY
  await testQuery('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await testQuery('ALTER SEQUENCE games_id_seq RESTART WITH 1');
};

const teardownTestDatabase = async () => {
  console.log('🧹 Cleaning up test database (sorstar_test)...');
  // Clean up after tests in TEST DATABASE ONLY
  await testQuery('DELETE FROM transactions');
  await testQuery('DELETE FROM cargo');
  await testQuery('DELETE FROM games');  
  await testQuery('DELETE FROM users');
};

// Global setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
  // Close the database connection pool to prevent Jest from hanging
  await testPool.end();
});

// Clean up after each test - TEST DATABASE ONLY
afterEach(async () => {
  await testQuery('DELETE FROM transactions');
  await testQuery('DELETE FROM cargo');
  await testQuery('DELETE FROM games');
  await testQuery('DELETE FROM users');
});

export { setupTestDatabase, teardownTestDatabase, testQuery as query, getTestClient as getClient };
import { query, getClient } from '../src/utils/database.js';

// Test database setup and cleanup
const setupTestDatabase = async () => {
  // Clean up all tables for testing
  await query('DELETE FROM transactions');
  await query('DELETE FROM cargo');
  await query('DELETE FROM games');
  await query('DELETE FROM users');
  
  // Reset sequences
  await query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await query('ALTER SEQUENCE games_id_seq RESTART WITH 1');
};

const teardownTestDatabase = async () => {
  // Clean up after tests
  await query('DELETE FROM transactions');
  await query('DELETE FROM cargo');
  await query('DELETE FROM games');  
  await query('DELETE FROM users');
};

// Global setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Clean up after each test
afterEach(async () => {
  await query('DELETE FROM transactions');
  await query('DELETE FROM cargo');
  await query('DELETE FROM games');
  await query('DELETE FROM users');
});

export { setupTestDatabase, teardownTestDatabase };
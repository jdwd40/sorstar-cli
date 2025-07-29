import { query as prodQuery, getClient as prodGetClient } from './database.js';
import { testQuery, getTestClient } from './testDatabase.js';

// Export functions that can be overridden for testing
export let query = prodQuery;
export let getClient = prodGetClient;

// Function to switch to test database
export const useTestDatabase = () => {
  query = testQuery;
  getClient = getTestClient;
};

// Function to switch back to production database  
export const useProductionDatabase = () => {
  query = prodQuery;
  getClient = prodGetClient;
};
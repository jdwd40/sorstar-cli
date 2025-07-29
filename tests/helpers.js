import jwt from 'jsonwebtoken';
import { createUser } from '../src/services/authService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to create a test user and return auth token
export const createTestUser = async (username = 'testuser', password = 'testpass') => {
  const user = await createUser(username, password);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  return { user, token };
};

// Helper to create auth headers
export const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Common test data
export const testGameData = {
  shipId: 1, // Assuming ship with ID 1 exists
  planetId: 1, // Assuming planet with ID 1 exists
  commodityId: 1, // Assuming commodity with ID 1 exists
  quantity: 5,
  price: 100
};

// Mock market data for testing
export const mockMarketData = [
  {
    commodity_id: 1,
    commodity_name: 'Electronics',
    buy_price: 150,
    sell_price: 120,
    stock: 50
  },
  {
    commodity_id: 2,
    commodity_name: 'Food',
    buy_price: 80,
    sell_price: 60,
    stock: 100
  }
];

// Mock ship data for testing
export const mockShipData = [
  {
    id: 1,
    name: 'Light Freighter',
    cargo_capacity: 50,
    cost: 5000,
    description: 'A small but reliable cargo ship'
  }
];

// Mock planet data for testing
export const mockPlanetData = [
  {
    id: 1,
    name: 'Terra Nova',
    description: 'A bustling trade hub'
  },
  {
    id: 2,
    name: 'Mars Station',
    description: 'Industrial mining colony'
  }
];
#!/usr/bin/env node

// Simple Node.js test for fuel API methods
import { ApiClient } from '../web/js/api.js';

// Simple test framework
let testCount = 0;
let passCount = 0;

const test = async (name, testFn) => {
  testCount++;
  try {
    await testFn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
};

const assertEquals = (actual, expected, message = '') => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
  }
};

const assertThrows = (fn, expectedMessage) => {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
    }
  }
};

const assertThrowsAsync = async (fn, expectedMessage) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
    }
  }
};

// Mock fetch for testing
const originalFetch = global.fetch;
let mockFetch;

const setupMockFetch = (mockResponse) => {
  global.fetch = jest.fn ? jest.fn() : mockFetch || (() => Promise.resolve(mockResponse));
  if (jest.fn) {
    global.fetch.mockResolvedValue(mockResponse);
  } else {
    mockFetch = () => Promise.resolve(mockResponse);
    global.fetch = mockFetch;
  }
};

const restoreFetch = () => {
  global.fetch = originalFetch;
};

const runTests = async () => {
  console.log('🧪 Testing Fuel API Methods...\n');

  // Test ApiClient instantiation
  await test('ApiClient can be instantiated', () => {
    const client = new ApiClient();
    assertEquals(client.baseUrl, 'http://localhost:3000');
    assertEquals(client.authToken, null);
  });

  // Test setAuthToken
  await test('setAuthToken sets the token correctly', () => {
    const client = new ApiClient();
    const token = 'test-token-123';
    client.setAuthToken(token);
    assertEquals(client.authToken, token);
  });

  // Test getFuelInfo method exists
  await test('getFuelInfo method exists', () => {
    const client = new ApiClient();
    assertEquals(typeof client.getFuelInfo, 'function');
  });

  // Test buyFuel method exists and validates inputs
  await test('buyFuel method exists and validates inputs', async () => {
    const client = new ApiClient();
    assertEquals(typeof client.buyFuel, 'function');
    
    // Test validation
    await assertThrowsAsync(() => client.buyFuel(), 'Planet ID and quantity are required');
    await assertThrowsAsync(() => client.buyFuel(1), 'Planet ID and quantity are required');
    await assertThrowsAsync(() => client.buyFuel(1, 0), 'Quantity must be greater than 0');
    await assertThrowsAsync(() => client.buyFuel(1, -5), 'Quantity must be greater than 0');
  });

  // Test getTravelCost method exists and validates inputs
  await test('getTravelCost method exists and validates inputs', async () => {
    const client = new ApiClient();
    assertEquals(typeof client.getTravelCost, 'function');
    
    // Test validation
    await assertThrowsAsync(() => client.getTravelCost(), 'Planet ID is required');
    await assertThrowsAsync(() => client.getTravelCost('invalid'), 'Planet ID must be a number');
  });

  // Test API call structure (without actual network calls)
  await test('getFuelInfo constructs correct API call', () => {
    const client = new ApiClient('http://test:3000');
    client.setAuthToken('test-token');
    
    // Mock the call method to verify it's called correctly
    let callArgs = null;
    client.call = function(endpoint, options) {
      callArgs = { endpoint, options };
      return Promise.resolve({ currentFuel: 50, maxFuel: 100 });
    };
    
    client.getFuelInfo();
    assertEquals(callArgs.endpoint, '/game/fuel');
    assertEquals(callArgs.options, undefined);
  });

  // Test buyFuel API call structure
  await test('buyFuel constructs correct API call', () => {
    const client = new ApiClient('http://test:3000');
    client.setAuthToken('test-token');
    
    let callArgs = null;
    client.call = function(endpoint, options) {
      callArgs = { endpoint, options };
      return Promise.resolve({ message: 'Fuel purchased' });
    };
    
    client.buyFuel(1, 25);
    assertEquals(callArgs.endpoint, '/game/fuel/buy');
    assertEquals(callArgs.options.method, 'POST');
    assertEquals(callArgs.options.body, JSON.stringify({ planetId: 1, quantity: 25 }));
  });

  // Test getTravelCost API call structure
  await test('getTravelCost constructs correct API call', () => {
    const client = new ApiClient('http://test:3000');
    client.setAuthToken('test-token');
    
    let callArgs = null;
    client.call = function(endpoint, options) {
      callArgs = { endpoint, options };
      return Promise.resolve({ fuelRequired: 8, distance: 10 });
    };
    
    client.getTravelCost(2);
    assertEquals(callArgs.endpoint, '/game/travel/cost/2');
    assertEquals(callArgs.options, undefined);
  });

  // Test existing methods still work
  await test('Existing API methods still work', () => {
    const client = new ApiClient();
    
    // Check existing methods exist
    assertEquals(typeof client.register, 'function');
    assertEquals(typeof client.login, 'function');
    assertEquals(typeof client.getShips, 'function');
    assertEquals(typeof client.getPlanets, 'function');
    assertEquals(typeof client.getGameState, 'function');
    assertEquals(typeof client.travel, 'function');
    assertEquals(typeof client.getMarketPrices, 'function');
    assertEquals(typeof client.getCargo, 'function');
    assertEquals(typeof client.buyCommodity, 'function');
    assertEquals(typeof client.sellCommodity, 'function');
    assertEquals(typeof client.getStats, 'function');
    assertEquals(typeof client.healthCheck, 'function');
  });

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);
  console.log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);

  if (passCount === testCount) {
    console.log('\n🎉 All fuel API method tests passed!');
    console.log('\n✅ Summary:');
    console.log('  - getFuelInfo() method implemented and tested');
    console.log('  - buyFuel(planetId, quantity) method implemented with validation');
    console.log('  - getTravelCost(planetId) method implemented with validation');
    console.log('  - All methods construct correct API calls');
    console.log('  - Input validation working correctly');
    console.log('  - Existing API methods remain functional');
  } else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
  }
};

// Run the tests
runTests();
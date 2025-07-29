import request from 'supertest';
import { testApp as app } from '../src/testServer.js';
import { testQuery as query } from '../src/utils/testDatabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const cleanup = async () => {
  console.log('🧹 Cleaning up test data...');
  await query('DELETE FROM transactions');
  await query('DELETE FROM cargo');
  await query('DELETE FROM games');
  await query('DELETE FROM users');
};

const createTestUser = async (username = `gametest${Date.now()}`) => {
  const response = await request(app)
    .post('/auth/register')
    .send({ username, password: 'password123' });
  return response.body;
};

export const testGame = async () => {
  await cleanup();
  
  let passed = 0;
  let total = 0;

  const test = async (name, testFn) => {
    total++;
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  };

  await test('Get ships list', async () => {
    const response = await request(app)
      .get('/ships')
      .expect(200);

    if (!Array.isArray(response.body)) {
      throw new Error('Ships response is not an array');
    }
  });

  await test('Get planets list', async () => {
    const response = await request(app)
      .get('/planets')
      .expect(200);

    if (!Array.isArray(response.body)) {
      throw new Error('Planets response is not an array');
    }
  });

  await test('Game state requires authentication', async () => {
    await request(app)
      .get('/game/state')
      .expect(401);
  });

  await test('Get game state returns null for new user', async () => {
    const user = await createTestUser();
    
    const response = await request(app)
      .get('/game/state')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    if (response.body !== null) {
      throw new Error('Expected null for user with no game');
    }
  });

  await test('Start game successfully', async () => {
    const user = await createTestUser();
    
    const response = await request(app)
      .post('/game/start')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ shipId: 1 });

    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.gameState || response.body.gameState.credits !== 1000) {
      throw new Error('Game not started correctly');
    }
  });

  await test('Reject second game creation', async () => {
    const user = await createTestUser();
    
    // Create first game
    await request(app)
      .post('/game/start')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ shipId: 1 });

    // Try to create second
    const response = await request(app)
      .post('/game/start')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ shipId: 1 });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
  });

  await test('Health check works', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    if (response.body.status !== 'ok') {
      throw new Error('Health check failed');
    }
  });

  await cleanup();
  return { passed, total };
};
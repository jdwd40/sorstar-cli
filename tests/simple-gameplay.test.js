import request from 'supertest';
import { testApp as app } from '../src/testServer.js';
import { testQuery as query } from '../src/utils/testDatabase.js';

const cleanup = async () => {
  console.log('🧹 Cleaning up test data...');
  await query('DELETE FROM transactions');
  await query('DELETE FROM cargo');
  await query('DELETE FROM games');
  await query('DELETE FROM users');
};

const createTestUserWithGame = async (username = `gameplaytest${Date.now()}`) => {
  const userResponse = await request(app)
    .post('/auth/register')
    .send({ username, password: 'password123' });

  await request(app)
    .post('/game/start')
    .set('Authorization', `Bearer ${userResponse.body.token}`)
    .send({ shipId: 1 });

  const gameResponse = await request(app)
    .get('/game/state')
    .set('Authorization', `Bearer ${userResponse.body.token}`);

  return {
    user: userResponse.body,
    game: gameResponse.body
  };
};

export const testGameplay = async () => {
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

  await test('Get market prices', async () => {
    const response = await request(app)
      .get('/market/1')
      .expect(200);

    if (!Array.isArray(response.body)) {
      throw new Error('Market response is not an array');
    }
  });

  await test('Invalid planet ID for market', async () => {
    await request(app)
      .get('/market/invalid')
      .expect(400);
  });

  await test('Cargo requires authentication', async () => {
    await request(app)
      .get('/cargo')
      .expect(401);
  });

  await test('Get empty cargo for new game', async () => {
    const { user } = await createTestUserWithGame();
    
    const response = await request(app)
      .get('/cargo')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    if (response.body.totalCargo !== 0 || !Array.isArray(response.body.cargo)) {
      throw new Error('Expected empty cargo');
    }
  });

  await test('Stats require authentication', async () => {
    await request(app)
      .get('/stats')
      .expect(401);
  });

  await test('Get game stats', async () => {
    const { user } = await createTestUserWithGame();
    
    const response = await request(app)
      .get('/stats')
      .set('Authorization', `Bearer ${user.token}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.user || !response.body.game) {
      throw new Error('Stats response missing user or game data');
    }
  });

  await test('Buy requires authentication', async () => {
    await request(app)
      .post('/buy')
      .send({ commodityId: 1, quantity: 1 })
      .expect(401);
  });

  await test('Buy commodity validation', async () => {
    const { user } = await createTestUserWithGame();
    
    // Test missing commodityId
    let response = await request(app)
      .post('/buy')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ quantity: 1 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing commodityId, got ${response.status}`);
    }

    // Test missing quantity
    response = await request(app)
      .post('/buy')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ commodityId: 1 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing quantity, got ${response.status}`);
    }

    // Test invalid quantity
    response = await request(app)
      .post('/buy')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ commodityId: 1, quantity: 0 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for invalid quantity, got ${response.status}`);
    }
  });

  await test('Sell requires authentication', async () => {
    await request(app)
      .post('/sell')
      .send({ commodityId: 1, quantity: 1 })
      .expect(401);
  });

  await test('Sell commodity validation', async () => {
    const { user } = await createTestUserWithGame();
    
    // Test missing commodityId
    let response = await request(app)
      .post('/sell')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ quantity: 1 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing commodityId, got ${response.status}`);
    }

    // Test missing quantity
    response = await request(app)
      .post('/sell')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ commodityId: 1 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing quantity, got ${response.status}`);
    }

    // Test invalid quantity
    response = await request(app)
      .post('/sell')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ commodityId: 1, quantity: 0 });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 for invalid quantity, got ${response.status}`);
    }
  });

  await test('404 for unknown endpoints', async () => {
    await request(app)
      .get('/nonexistent')
      .expect(404);
  });

  await cleanup();
  return { passed, total };
};
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

export const testAuth = async () => {
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

  await test('Register new user successfully', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' })
      .expect(201);

    if (!response.body.token || !response.body.user) {
      throw new Error('Missing token or user in response');
    }
  });

  await test('Reject registration with missing username', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ password: 'password123' })
      .expect(400);

    if (response.body.error !== 'Username and password required') {
      throw new Error('Wrong error message');
    }
  });

  await test('Reject duplicate username', async () => {
    // First registration
    await request(app)
      .post('/auth/register')
      .send({ username: 'duplicate', password: 'password123' });

    // Second registration should fail
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'duplicate', password: 'password123' })
      .expect(400);

    if (response.body.error !== 'Username already exists') {
      throw new Error('Wrong error message');
    }
  });

  await test('Login with valid credentials', async () => {
    // Register first
    await request(app)
      .post('/auth/register')
      .send({ username: 'logintest', password: 'password123' });

    // Then login
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'logintest', password: 'password123' })
      .expect(200);

    if (!response.body.token || response.body.user.username !== 'logintest') {
      throw new Error('Login failed or wrong user data');
    }
  });

  await test('Reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'nonexistent', password: 'wrongpass' })
      .expect(401);

    if (response.body.error !== 'User not found') {
      throw new Error('Wrong error message');
    }
  });

  await cleanup();
  return { passed, total };
};
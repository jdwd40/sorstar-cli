import request from 'supertest';
import { app } from '../src/server.js';
import { createTestUser } from './helpers.js';

describe('Authentication Endpoints', () => {
  describe('POST /auth/register', () => {
    test('should create a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User created successfully',
        user: {
          id: expect.any(Number),
          username: 'newuser'
        },
        token: expect.any(String)
      });

      // Verify password is not returned
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    test('should reject registration with missing username', async () => {
      const userData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });

    test('should reject registration with missing password', async () => {
      const userData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });

    test('should reject registration with duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username already exists'
      });
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });
  });

  describe('POST /auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Create a test user first
      const { user } = await createTestUser('loginuser', 'password123');

      const loginData = {
        username: 'loginuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        user: {
          id: user.id,
          username: 'loginuser'
        },
        token: expect.any(String)
      });

      // Verify password is not returned
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    test('should reject login with invalid username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'User not found'
      });
    });

    test('should reject login with invalid password', async () => {
      // Create a test user first
      await createTestUser('validuser', 'correctpassword');

      const loginData = {
        username: 'validuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid password'
      });
    });

    test('should reject login with missing username', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });

    test('should reject login with missing password', async () => {
      const loginData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password required'
      });
    });
  });

  describe('JWT Token Validation', () => {
    test('should return valid JWT token structure', async () => {
      const userData = {
        username: 'tokenuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.token;
      
      // Basic JWT structure validation (header.payload.signature)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Each part should be base64url encoded
      tokenParts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });
  });
});
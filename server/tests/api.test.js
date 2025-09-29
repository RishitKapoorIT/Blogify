const request = require('supertest');
const mongoose = require('mongoose');
let app;

// Force test environment before loading the app to avoid starting the server
// and to ensure test-specific behavior (like DB cleanup) is enabled.
process.env.NODE_ENV = 'test';
// Use a dedicated test database (does not affect production/dev DB)
if (!process.env.MONGO_DB_NAME) {
  process.env.MONGO_DB_NAME = 'blogify_test';
}

const hasMongoUri = Boolean(process.env.MONGO_URI);
if (hasMongoUri) {
  app = require('../server');
}

// Ensure clean DB before running tests to avoid conflicts from previous runs
beforeAll(async () => {
  if (hasMongoUri) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || 'blogify_test'
      });
    }
    await mongoose.connection.dropDatabase();
  }
});

describe('Health Check', () => {
  const title = hasMongoUri ? 'GET /api/health should return 200' : 'skipped (no MONGO_URI)';
  const maybe = hasMongoUri ? test : test.skip;
  maybe(title, async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Blogify API is running');
  });
});

describe('Auth Endpoints', () => {
  if (!hasMongoUri) {
    test.skip('skipped (no MONGO_URI)', () => {});
    return;
  }
  describe('POST /api/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('should reject invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test2@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'TestPass123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

// Clean up test database after tests
afterAll(async () => {
  if (process.env.NODE_ENV === 'test' && hasMongoUri) {
    const mongoose = require('mongoose');
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});
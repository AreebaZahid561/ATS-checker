const request = require('supertest');
const mongoose = require('../src/models/InMemoryDb');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Connect to a test database
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_checker_test';
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Test User');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    it('should login successfully', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});

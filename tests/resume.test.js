const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

let accessToken;
let user;

describe('Resume Endpoints', () => {
  beforeAll(async () => {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_checker_test';
    await mongoose.connect(url);

    await User.deleteMany({});
    user = await User.create({
      name: 'Resume User',
      email: 'resume@example.com',
      password: 'Password123!',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'resume@example.com',
      password: 'Password123!',
    });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('GET /api/resume/history', () => {
    it('should get empty history initially', async () => {
      const res = await request(app)
        .get('/api/resume/history')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  // Upload tests are harder to mock without an actual file, so we skip file upload tests in this minimal suite.
});

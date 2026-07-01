const request = require('supertest');
const mongoose = require('../src/models/InMemoryDb');
const app = require('../src/app');
const User = require('../src/models/User');

let accessToken;
let user;

describe('ATS Endpoints', () => {
  beforeAll(async () => {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_checker_test';
    await mongoose.connect(url);

    await User.deleteMany({});
    user = await User.create({
      name: 'ATS User',
      email: 'ats@example.com',
      password: 'Password123!',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'ats@example.com',
      password: 'Password123!',
    });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/ats/analyze', () => {
    it('should fail if resumeId is missing', async () => {
      const res = await request(app)
        .post('/api/ats/analyze')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Resume ID is required');
    });

    // Actually analyzing a resume requires uploading one first, which is complex for this minimal test suite.
  });
});

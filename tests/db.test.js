jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
  },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('connectDB', () => {
  const mongoose = require('mongoose');
  const logger = require('../src/config/logger');

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGODB_URI;
    jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false and logs a warning when MongoDB URI is not configured', async () => {
    const connectDB = require('../src/config/db');

    await expect(connectDB()).resolves.toBe(false);
    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('MongoDB URI not configured'));
  });
});

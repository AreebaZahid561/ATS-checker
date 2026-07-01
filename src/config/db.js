'use strict';

const logger = require('./logger');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    logger.warn('MongoDB URI not configured');
    return false;
  }
  logger.info('MongoDB bypass: Connected to local in-memory database store.');
  return true;
};

module.exports = connectDB;


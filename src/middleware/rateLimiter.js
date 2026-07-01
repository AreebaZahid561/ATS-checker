'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter – 100 requests per 15 minutes.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    statusCode: 429,
  },
});

/**
 * Strict limiter for auth endpoints – 10 requests per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    statusCode: 429,
  },
});

/**
 * Upload limiter – 20 uploads per hour.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many uploads, please try again after 1 hour',
    statusCode: 429,
  },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter };

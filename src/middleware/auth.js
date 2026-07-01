'use strict';

const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const { sendError } = require('../utils/response');

/**
 * Authenticate middleware – verifies Bearer JWT token.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Access token has expired');
      }
      return sendError(res, 401, 'Invalid access token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      return sendError(res, 401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize middleware – restricts access to specific roles.
 * @param  {...string} roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { authenticate, authorize };

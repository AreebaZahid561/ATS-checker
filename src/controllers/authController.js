'use strict';

const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

/**
 * Register a new candidate user.
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    sendSuccess(res, 201, 'Registration successful. Please check your email to verify your account.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user.
 */
const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    sendSuccess(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout a user.
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);
    sendSuccess(res, 200, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token.
 */
const refresh = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset link.
 */
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, 200, 'If an account with that email exists, a password reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password.
 */
const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    sendSuccess(res, 200, 'Password has been reset successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required', statusCode: 400 });
    }
    await authService.verifyEmail(token);
    sendSuccess(res, 200, 'Email verified successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user.
 */
const getMe = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'User profile retrieved', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        verified: req.user.verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
};

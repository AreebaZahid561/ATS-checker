'use strict';

const express = require('express');
const authRoutes = require('./authRoutes');
const resumeRoutes = require('./resumeRoutes');
const atsRoutes = require('./atsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/resume', resumeRoutes);
router.use('/ats', atsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running smoothly' });
});

module.exports = router;

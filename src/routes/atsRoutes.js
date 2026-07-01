'use strict';

const express = require('express');
const atsController = require('../controllers/atsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ATS
 *   description: ATS scoring and analysis endpoints
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/ats/analyze:
 *   post:
 *     summary: Analyze a resume and calculate ATS score
 *     tags: [ATS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *             properties:
 *               resumeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: ATS Analysis completed
 */
router.post('/analyze', atsController.analyzeResume);

/**
 * @swagger
 * /api/ats/{resumeId}:
 *   get:
 *     summary: Get ATS analysis for a specific resume
 *     tags: [ATS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resumeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ATS Analysis retrieved
 */
router.get('/:resumeId', atsController.getAnalysis);

module.exports = router;

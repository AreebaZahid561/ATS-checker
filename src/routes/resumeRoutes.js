'use strict';

const express = require('express');
const resumeController = require('../controllers/resumeController');
const { authenticate } = require('../middleware/auth');
const { upload, handleFileTypeError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Resume
 *   description: Resume upload and management endpoints
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/resume/upload:
 *   post:
 *     summary: Upload and parse a resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resume uploaded and parsed successfully
 */
router.post(
  '/upload',
  uploadLimiter,
  upload.single('file'),
  handleFileTypeError,
  resumeController.uploadResume
);

/**
 * @swagger
 * /api/resume/history:
 *   get:
 *     summary: Get resume upload history
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resume history retrieved
 */
router.get('/history', resumeController.getHistory);

/**
 * @swagger
 * /api/resume/{id}:
 *   get:
 *     summary: Get a specific resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume retrieved
 */
router.get('/:id', resumeController.getResume);

/**
 * @swagger
 * /api/resume/{id}:
 *   delete:
 *     summary: Delete a resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 */
router.delete('/:id', resumeController.deleteResume);

module.exports = router;

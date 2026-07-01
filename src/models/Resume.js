'use strict';

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Resume:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         originalName:
 *           type: string
 *         fileName:
 *           type: string
 *         fileType:
 *           type: string
 *           enum: [pdf, docx]
 *         fileSize:
 *           type: number
 *         filePath:
 *           type: string
 *         status:
 *           type: string
 *           enum: [uploaded, parsing, parsed, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'parsing', 'parsed', 'failed'],
      default: 'uploaded',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: link to parsed resume
resumeSchema.virtual('parsedData', {
  ref: 'ParsedResume',
  localField: '_id',
  foreignField: 'resume',
  justOne: true,
});

module.exports = mongoose.model('Resume', resumeSchema);

'use strict';

const mongoose = require('./InMemoryDb');

const categoryScoreSchema = new mongoose.Schema({
  score: { type: Number, min: 0, max: 100, required: true },
  maxScore: { type: Number, required: true },
  feedback: { type: String, default: '' },
  suggestions: [String],
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ATSAnalysis:
 *       type: object
 *       properties:
 *         resume:
 *           type: string
 *         user:
 *           type: string
 *         overallScore:
 *           type: number
 *           description: Overall ATS score out of 100
 *         grade:
 *           type: string
 *           enum: [Excellent, Good, Fair, Poor]
 *         categories:
 *           type: object
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const atsAnalysisSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    grade: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    categories: {
      contactInfo: categoryScoreSchema,
      formatting: categoryScoreSchema,
      resumeLength: categoryScoreSchema,
      skills: categoryScoreSchema,
      education: categoryScoreSchema,
      experience: categoryScoreSchema,
      summary: categoryScoreSchema,
      sectionCompleteness: categoryScoreSchema,
      readability: categoryScoreSchema,
      keywords: categoryScoreSchema,
    },
    suggestions: [String],
    topSuggestions: [String],
  },
  { timestamps: true }
);

// Compute grade from score
atsAnalysisSchema.statics.computeGrade = function (score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

module.exports = mongoose.model('ATSAnalysis', atsAnalysisSchema);

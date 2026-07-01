'use strict';

const mongoose = require('./InMemoryDb');

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  gpa: { type: String, default: '' },
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  title: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
  bullets: [String],
});

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: [String],
  url: { type: String, default: '' },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ParsedResume:
 *       type: object
 *       properties:
 *         resume:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         linkedin:
 *           type: string
 *         github:
 *           type: string
 *         portfolio:
 *           type: string
 *         summary:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         education:
 *           type: array
 *         experience:
 *           type: array
 *         projects:
 *           type: array
 *         certifications:
 *           type: array
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *         awards:
 *           type: array
 *           items:
 *             type: string
 */
const parsedResumeSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: [String],
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    languages: [String],
    awards: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParsedResume', parsedResumeSchema);

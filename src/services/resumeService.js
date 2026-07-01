'use strict';

const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const ParsedResume = require('../models/ParsedResume');
const { AppError } = require('../middleware/errorHandler');
const { extractTextFromPDF } = require('../parsers/pdfParser');
const { extractTextFromDOCX } = require('../parsers/docxParser');
const { extractResumeData } = require('../parsers/resumeExtractor');
const { ALLOWED_TYPES } = require('../middleware/upload');
const logger = require('../config/logger');

/**
 * Save uploaded resume metadata to DB, then parse it.
 * @param {Express.Multer.File} file
 * @param {string} userId
 * @returns {Promise<{resume: Resume, parsed: ParsedResume}>}
 */
const uploadAndParse = async (file, userId) => {
  const fileType = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname).replace('.', '');

  // Create resume record
  const resume = await Resume.create({
    user: userId,
    originalName: file.originalname,
    fileName: file.filename,
    fileType,
    fileSize: file.size,
    filePath: file.path,
    status: 'parsing',
  });

  try {
    // Extract raw text
    let rawText = '';
    if (fileType === 'pdf') {
      rawText = await extractTextFromPDF(file.path);
    } else {
      rawText = await extractTextFromDOCX(file.path);
    }

    // Extract structured data
    const extractedData = extractResumeData(rawText);

    // Save parsed data
    const parsed = await ParsedResume.create({
      resume: resume._id,
      user: userId,
      ...extractedData,
    });

    // Update resume status
    resume.status = 'parsed';
    await resume.save();

    return { resume, parsed };
  } catch (error) {
    logger.error(`Resume parsing failed for ${file.filename}: ${error.message}`);
    resume.status = 'failed';
    resume.errorMessage = error.message;
    await resume.save();
    throw new AppError(`Resume parsing failed: ${error.message}`, 422);
  }
};

/**
 * Get resume by ID (only if owned by user).
 */
const getResumeById = async (resumeId, userId) => {
  const resume = await Resume.findOne({ _id: resumeId, user: userId }).populate('parsedData');
  if (!resume) {
    throw new AppError('Resume not found', 404);
  }
  return resume;
};

/**
 * Get all resumes for a user.
 */
const getResumeHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [resumes, total] = await Promise.all([
    Resume.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('parsedData'),
    Resume.countDocuments({ user: userId }),
  ]);

  return {
    resumes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Delete a resume and its associated parsed data.
 */
const deleteResume = async (resumeId, userId) => {
  const resume = await Resume.findOne({ _id: resumeId, user: userId });
  if (!resume) {
    throw new AppError('Resume not found', 404);
  }

  // Delete file from disk
  if (fs.existsSync(resume.filePath)) {
    fs.unlinkSync(resume.filePath);
  }

  // Delete parsed data
  await ParsedResume.deleteOne({ resume: resumeId });

  // Delete resume record
  await Resume.deleteOne({ _id: resumeId });

  return true;
};

/**
 * Check for duplicate resume upload (same original name for same user).
 */
const checkDuplicate = async (originalName, userId) => {
  const existing = await Resume.findOne({ user: userId, originalName });
  return !!existing;
};

module.exports = { uploadAndParse, getResumeById, getResumeHistory, deleteResume, checkDuplicate };

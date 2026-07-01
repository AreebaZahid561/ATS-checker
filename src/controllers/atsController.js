'use strict';

const atsService = require('../services/atsService');
const resumeService = require('../services/resumeService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Analyze a resume and calculate ATS score.
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return sendError(res, 400, 'Resume ID is required');
    }

    // Verify resume exists and belongs to user, and get parsed data
    const resume = await resumeService.getResumeById(resumeId, req.user._id);
    
    if (resume.status !== 'parsed' || !resume.parsedData) {
      return sendError(res, 400, 'Resume is not parsed yet or parsing failed');
    }

    const analysis = await atsService.analyzeResume(resume.parsedData, req.user._id);

    sendSuccess(res, 200, 'ATS Analysis completed', { analysis });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ATS analysis for a specific resume.
 */
const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await atsService.getAnalysis(req.params.resumeId, req.user._id);
    
    if (!analysis) {
      return sendError(res, 404, 'ATS Analysis not found for this resume');
    }

    sendSuccess(res, 200, 'ATS Analysis retrieved', { analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  getAnalysis,
};

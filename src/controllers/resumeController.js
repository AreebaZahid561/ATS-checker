'use strict';

const resumeService = require('../services/resumeService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Upload and parse a resume.
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload a PDF or DOCX file');
    }

    const isDuplicate = await resumeService.checkDuplicate(req.file.originalname, req.user._id);
    if (isDuplicate) {
      return sendError(res, 409, 'A resume with this name has already been uploaded');
    }

    const { resume, parsed } = await resumeService.uploadAndParse(req.file, req.user._id);

    sendSuccess(res, 201, 'Resume uploaded and parsed successfully', {
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        status: resume.status,
      },
      parsedData: parsed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get resume history for current user.
 */
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const history = await resumeService.getResumeHistory(req.user._id, page, limit);
    
    sendSuccess(res, 200, 'Resume history retrieved', history.resumes, history.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific resume by ID.
 */
const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.user._id);
    sendSuccess(res, 200, 'Resume retrieved', { resume });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a resume.
 */
const deleteResume = async (req, res, next) => {
  try {
    await resumeService.deleteResume(req.params.id, req.user._id);
    sendSuccess(res, 200, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getHistory,
  getResume,
  deleteResume,
};

'use strict';

const mammoth = require('mammoth');
const logger = require('../config/logger');

/**
 * Extract raw text from a DOCX file.
 * @param {string} filePath - Absolute path to the DOCX file
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    if (result.messages && result.messages.length > 0) {
      result.messages.forEach((msg) => {
        logger.warn(`DOCX parse warning: ${msg.message}`);
      });
    }
    return result.value || '';
  } catch (error) {
    logger.error(`DOCX parsing failed for ${filePath}: ${error.message}`);
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
};

module.exports = { extractTextFromDOCX };

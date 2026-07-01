'use strict';

const pdfParse = require('pdf-parse');
const fs = require('fs');
const logger = require('../config/logger');

/**
 * Extract raw text from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    logger.error(`PDF parsing failed for ${filePath}: ${error.message}`);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

module.exports = { extractTextFromPDF };

'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ATS Checker API',
      version: '1.0.0',
      description:
        'A production-quality REST API for Resume Parsing and ATS Compatibility Analysis. Supports user authentication, resume upload (PDF/DOCX), resume parsing, and ATS scoring.',
      contact: {
        name: 'AreebaZahid561',
        url: 'https://github.com/AreebaZahid561/ATS-checker',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

'use strict';

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { stack: err.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;

// Connect to Database and start server
connectDB().then(() => {
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API Docs available at http://localhost:${PORT}/api/docs`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { message: err.message, stack: err.stack });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle graceful shutdown (SIGTERM)
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Process terminated!');
    });
  }
});

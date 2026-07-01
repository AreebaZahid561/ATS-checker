'use strict';

const { sendError } = require('../utils/response');

/**
 * Validate request using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Where to read data from
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }

    // Replace request data with parsed (coerced/stripped) values
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };

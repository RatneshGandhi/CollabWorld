import { ZodError } from 'zod';

/**
 * Higher-order middleware to validate req.body, req.query, or req.params against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema object
 * @param {'body' | 'query' | 'params'} source - Request property to validate (default: 'body')
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const validated = schema.parse(req[source]);
    req[source] = validated; // Replaces raw input with sanitized/coerced values
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        status: 'fail',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    next(error);
  }
};
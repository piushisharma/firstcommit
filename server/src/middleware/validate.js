/**
 * Express middleware factory.
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0]?.message || 'Invalid input',
        },
      });
    }
    req[source] = result.data; // replace with parsed/coerced data
    next();
  };
}

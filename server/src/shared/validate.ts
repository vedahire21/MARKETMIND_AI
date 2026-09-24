import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateSchema(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: `Invalid request ${source} schema`,
          issues: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return validateSchema(schema, 'query');
}

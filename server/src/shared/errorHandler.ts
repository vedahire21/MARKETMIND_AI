import { Request, Response, NextFunction } from 'express';
import { logger } from './auditLogger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const traceId = (req.headers['x-trace-id'] as string) || 'unknown-trace';
  const status = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected internal error occurred on the server'
    : err.message || 'Internal Server Error';

  logger.error({
    traceId,
    status,
    errorCode,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  }, `Express Error Handler caught: ${err.message}`);

  return res.status(status).json({
    error: errorCode,
    message,
    timestamp: new Date().toISOString(),
    traceId
  });
}

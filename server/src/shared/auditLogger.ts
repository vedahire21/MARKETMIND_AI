import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { AuthenticatedRequest } from './authMiddleware';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export function requestLogger(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const traceId = (req.headers['x-trace-id'] as string) || `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  req.headers['x-trace-id'] = traceId;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info({
      traceId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.userId || 'ANONYMOUS',
      ip: req.ip || req.socket.remoteAddress
    }, `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
  });

  next();
}

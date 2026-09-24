import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import aiRoutes from './modules/ai/ai.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import { requestLogger } from './shared/auditLogger';
import { createRateLimiter } from './shared/rateLimiter';
import { errorHandler } from './shared/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(requestLogger);

// Global General Rate Limiter (100 requests per 15 minutes)
const globalRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 });
app.use(globalRateLimiter);

// Auth Rate Limiter (10 login attempts per 15 minutes)
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10, message: 'Too many login/auth attempts. Please wait 15 minutes.' });
app.use('/api/v1/auth/login', authRateLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Healthcheck Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'MarketMind AI Platform Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Root API Endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to MarketMind AI Enterprise API',
    version: '1.0.0',
    docs: '/docs'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 MarketMind AI Server running on port ${PORT}`);
  });
}

export default app;

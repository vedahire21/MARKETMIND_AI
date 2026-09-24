import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);

// Healthcheck Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'MarketMind AI Platform Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

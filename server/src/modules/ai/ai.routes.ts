import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticateJWT, requireRole } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { SellerCopilotSchema } from './ai.schema';

const router = Router();

// Public Routes
router.get('/recommendations', AIController.getRecommendations);

// Authenticated Routes
router.post('/support/chat', authenticateJWT, AIController.supportChat);

// Seller Routes
router.post('/seller-copilot/generate', authenticateJWT, requireRole(['SELLER', 'ADMIN']), validateSchema(SellerCopilotSchema), AIController.generateListing);
router.post('/seller-copilot/approve/:productId', authenticateJWT, requireRole(['SELLER', 'ADMIN']), AIController.approveListing);
router.get('/inventory/forecast', authenticateJWT, requireRole(['SELLER', 'ADMIN']), AIController.getInventoryForecast);

// Admin Routes
router.get('/anomalies/investigate', authenticateJWT, requireRole(['ADMIN']), AIController.investigateAnomalies);

export default router;

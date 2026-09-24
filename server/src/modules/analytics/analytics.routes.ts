import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticateJWT, requireRole } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { AskBusinessAnalystSchema } from './analytics.schema';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(['SELLER', 'ADMIN']));

router.post('/ask', validateSchema(AskBusinessAnalystSchema), AnalyticsController.askBusinessAnalyst);
router.get('/revenue', AnalyticsController.getRevenue);

export default router;

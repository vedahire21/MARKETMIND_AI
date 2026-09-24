import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticateJWT, requireRole } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { SellerCopilotSchema } from './ai.schema';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(['SELLER', 'ADMIN']));

router.post('/seller-copilot/generate', validateSchema(SellerCopilotSchema), AIController.generateListing);
router.post('/seller-copilot/approve/:productId', AIController.approveListing);

export default router;

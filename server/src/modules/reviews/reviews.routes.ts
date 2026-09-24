import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { authenticateJWT } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { CreateReviewSchema } from './reviews.schema';

const router = Router();

router.get('/intelligence/:productId', ReviewsController.getIntelligence);
router.post('/', authenticateJWT, validateSchema(CreateReviewSchema), ReviewsController.createReview);

export default router;

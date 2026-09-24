import { Router } from 'express';
import { CartController } from './cart.controller';
import { authenticateJWT } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { AddCartItemSchema } from './cart.schema';

const router = Router();

router.use(authenticateJWT);

router.get('/', CartController.getCart);
router.post('/items', validateSchema(AddCartItemSchema), CartController.addItem);
router.delete('/items/:variantId', CartController.removeItem);

export default router;

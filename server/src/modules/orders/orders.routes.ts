import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { authenticateJWT } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { CheckoutSchema } from './orders.schema';

const router = Router();

router.use(authenticateJWT);

router.post('/checkout', validateSchema(CheckoutSchema), OrdersController.checkout);
router.get('/my-orders', OrdersController.getMyOrders);
router.get('/:id', OrdersController.getOrderById);

export default router;

import { Response, NextFunction } from 'express';
import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class OrdersController {
  static async checkout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await OrdersService.checkout(req.user!.userId, req.body);
      return res.status(result.isDuplicate ? 200 : 201).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await OrdersService.getCustomerOrders(req.user!.userId);
      return res.status(200).json({ orders });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrdersService.getOrderById(id, req.user!.userId);
      return res.status(200).json({ order });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }
}

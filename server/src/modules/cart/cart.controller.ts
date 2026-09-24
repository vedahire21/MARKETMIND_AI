import { Response, NextFunction } from 'express';
import { CartService } from './cart.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class CartController {
  static async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.getCart(req.user!.userId);
      return res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }

  static async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { variantId, quantity } = req.body;
      const cart = await CartService.addItem(req.user!.userId, variantId, quantity);
      return res.status(200).json(cart);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;
      const cart = await CartService.removeItem(req.user!.userId, variantId);
      return res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }
}

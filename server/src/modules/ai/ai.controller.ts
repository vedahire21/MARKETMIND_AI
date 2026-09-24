import { Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class AIController {
  static async generateListing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'User does not have an active seller profile' });
      }

      const result = await AIService.generateSellerListing(sellerId, req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async approveListing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'User does not have an active seller profile' });
      }

      const { productId } = req.params;
      const result = await AIService.approveProductListing(productId, sellerId);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }
}

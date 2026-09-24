import { Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class AnalyticsController {
  static async askBusinessAnalyst(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId || 'mock-seller-id';
      const { query } = req.body;
      const result = await AnalyticsService.askBusinessAnalyst(sellerId, query);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId || 'mock-seller-id';
      const result = await AnalyticsService.getRevenueByProduct(sellerId);
      return res.status(200).json({ revenue: result });
    } catch (err) {
      next(err);
    }
  }
}

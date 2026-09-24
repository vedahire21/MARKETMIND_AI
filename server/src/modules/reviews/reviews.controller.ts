import { Request, Response, NextFunction } from 'express';
import { ReviewsService } from './reviews.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class ReviewsController {
  static async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const review = await ReviewsService.createReview(req.user!.userId, req.body);
      return res.status(201).json({ review });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async getIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const intelligence = await ReviewsService.getReviewIntelligence(productId);
      return res.status(200).json(intelligence);
    } catch (err) {
      next(err);
    }
  }
}

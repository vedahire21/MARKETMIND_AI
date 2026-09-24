import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { SupportAgentService } from './supportAgent.service';
import { RecommendationEngineService } from './recommendationEngine.service';
import { InventoryIntelligenceService } from './inventoryIntelligence.service';
import { AnomalyInvestigatorService } from './anomalyInvestigator.service';
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

  static async supportChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query, orderId } = req.body;
      const result = await SupportAgentService.handleSupportQuery(req.user!.userId, query, orderId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, limit } = req.query;
      const result = await RecommendationEngineService.getRecommendations(
        undefined,
        categoryId as string,
        limit ? Number(limit) : 5
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getInventoryForecast(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'Seller profile required' });
      }

      const result = await InventoryIntelligenceService.getInventoryForecast(sellerId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async investigateAnomalies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AnomalyInvestigatorService.investigateAnomalies();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

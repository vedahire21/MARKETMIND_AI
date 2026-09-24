import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class CatalogController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CatalogService.createCategory(req.body);
      return res.status(201).json({ category });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CatalogService.getCategories();
      return res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'User does not have an active seller profile' });
      }

      const product = await CatalogService.createProduct(sellerId, req.body);
      return res.status(201).json({ product });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async createVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'User does not have an active seller profile' });
      }

      const { productId } = req.params;
      const variant = await CatalogService.createVariant(productId, sellerId, req.body);
      return res.status(201).json({ variant });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CatalogService.getProducts(req.query as any);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const product = await CatalogService.getProductBySlug(slug);
      return res.status(200).json({ product });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: 'NO_SELLER_PROFILE', message: 'User does not have an active seller profile' });
      }

      const { productId } = req.params;
      const { status } = req.body;
      const updated = await CatalogService.updateProductStatus(productId, sellerId, status);
      return res.status(200).json({ product: updated });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }
}

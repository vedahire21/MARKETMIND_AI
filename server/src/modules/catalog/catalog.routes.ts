import { Router } from 'express';
import { CatalogController } from './catalog.controller';
import { validateSchema, validateQuery } from '../../shared/validate';
import { authenticateJWT, requireRole } from '../../shared/authMiddleware';
import { CreateCategorySchema, CreateProductSchema, CreateVariantSchema, UpdateProductStatusSchema, ProductQuerySchema } from './catalog.schema';

const router = Router();

// Public Routes
router.get('/categories', CatalogController.getCategories);
router.get('/products', validateQuery(ProductQuerySchema), CatalogController.getProducts);
router.get('/products/:slug', CatalogController.getProductBySlug);

// Protected Admin Routes
router.post('/categories', authenticateJWT, requireRole(['ADMIN']), validateSchema(CreateCategorySchema), CatalogController.createCategory);

// Protected Seller Routes
router.post('/products', authenticateJWT, requireRole(['SELLER']), validateSchema(CreateProductSchema), CatalogController.createProduct);
router.post('/products/:productId/variants', authenticateJWT, requireRole(['SELLER']), validateSchema(CreateVariantSchema), CatalogController.createVariant);
router.patch('/products/:productId/status', authenticateJWT, requireRole(['SELLER']), validateSchema(UpdateProductStatusSchema), CatalogController.updateStatus);

export default router;

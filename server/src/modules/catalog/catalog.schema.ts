import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
});

export const CreateProductSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID format'),
  title: z.string().min(3, 'Product title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT')
});

export const CreateVariantSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().positive('Price must be greater than 0'),
  attributes: z.record(z.any()).default({}),
  initialQuantity: z.number().int().min(0, 'Initial quantity cannot be negative').default(0),
  reorderPoint: z.number().int().min(0).default(10)
});

export const UpdateProductStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
});

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional().default('ACTIVE'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

import { describe, it, expect } from 'vitest';
import { CreateCategorySchema, CreateProductSchema, CreateVariantSchema, ProductQuerySchema } from '../catalog.schema';

describe('Catalog Zod Validation Schemas', () => {
  it('should validate valid category input', () => {
    const valid = CreateCategorySchema.safeParse({ name: 'Electronics', slug: 'electronics' });
    expect(valid.success).toBe(true);
  });

  it('should reject invalid slug format in category', () => {
    const invalid = CreateCategorySchema.safeParse({ name: 'Electronics', slug: 'Invalid Slug!' });
    expect(invalid.success).toBe(false);
  });

  it('should validate product creation schema', () => {
    const valid = CreateProductSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Smart AI Camera',
      description: 'High performance AI security camera with night vision.',
      tags: ['ai', 'camera', 'smart-home'],
      status: 'ACTIVE'
    });
    expect(valid.success).toBe(true);
  });

  it('should validate variant creation with price & attributes', () => {
    const valid = CreateVariantSchema.safeParse({
      sku: 'CAM-AI-001-BLK',
      name: 'Black Edition',
      price: 299.99,
      attributes: { color: 'Black', storage: '128GB' },
      initialQuantity: 50,
      reorderPoint: 10
    });
    expect(valid.success).toBe(true);
  });

  it('should coerce numbers in product query search', () => {
    const parsed = ProductQuerySchema.parse({
      minPrice: '50',
      maxPrice: '500',
      page: '2',
      limit: '10'
    });
    expect(parsed.minPrice).toBe(50);
    expect(parsed.maxPrice).toBe(500);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
  });
});

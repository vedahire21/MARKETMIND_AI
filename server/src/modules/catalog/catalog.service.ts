import { prisma } from '../../shared/prisma';
import { z } from 'zod';
import { CreateCategorySchema, CreateProductSchema, CreateVariantSchema, ProductQuerySchema } from './catalog.schema';

type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
type CreateProductInput = z.infer<typeof CreateProductSchema>;
type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
type ProductQueryInput = z.infer<typeof ProductQuerySchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CatalogService {
  static async createCategory(input: CreateCategoryInput) {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: input.name }, { slug: input.slug }] }
    });

    if (existing) {
      throw { status: 409, code: 'CATEGORY_EXISTS', message: 'Category with this name or slug already exists' };
    }

    return prisma.category.create({ data: input });
  }

  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async createProduct(sellerId: string, input: CreateProductInput) {
    const baseSlug = slugify(input.title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId: input.categoryId,
        title: input.title,
        slug: uniqueSlug,
        description: input.description,
        tags: input.tags,
        seoTitle: input.seoTitle,
        seoDesc: input.seoDesc,
        status: input.status
      },
      include: {
        category: true,
        seller: {
          select: { id: true, storeName: true, rating: true }
        }
      }
    });

    return product;
  }

  static async createVariant(productId: string, sellerId: string, input: CreateVariantInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    if (product.sellerId !== sellerId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'You do not own this product' };
    }

    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: input.sku }
    });

    if (existingSku) {
      throw { status: 409, code: 'SKU_EXISTS', message: `Product variant with SKU '${input.sku}' already exists` };
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: input.sku,
        name: input.name,
        price: input.price,
        attributes: input.attributes,
        inventory: {
          create: {
            quantity: input.initialQuantity,
            reorderPoint: input.reorderPoint
          }
        }
      },
      include: {
        inventory: true
      }
    });

    return variant;
  }

  static async getProducts(query: ProductQueryInput) {
    const { search, categoryId, sellerId, minPrice, maxPrice, status, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {})
          }
        }
      };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          seller: { select: { id: true, storeName: true, rating: true } },
          variants: {
            include: { inventory: { select: { quantity: true, reservedQuantity: true } } }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        seller: { select: { id: true, storeName: true, rating: true } },
        variants: {
          include: { inventory: true }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    return product;
  }

  static async updateProductStatus(productId: string, sellerId: string, status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    if (product.sellerId !== sellerId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'You do not own this product' };
    }

    return prisma.product.update({
      where: { id: productId },
      data: { status }
    });
  }
}

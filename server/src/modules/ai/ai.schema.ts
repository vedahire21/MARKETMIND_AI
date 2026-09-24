import { z } from 'zod';

export const SellerCopilotSchema = z.object({
  productName: z.string().min(2, 'productName must be at least 2 characters'),
  category: z.string().min(2, 'category is required'),
  roughNotes: z.string().min(10, 'roughNotes must be at least 10 characters long'),
  targetAudience: z.string().optional()
});

export const ApproveProductListingSchema = z.object({
  productId: z.string().uuid('Invalid product ID format')
});

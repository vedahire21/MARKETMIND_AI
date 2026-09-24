import { z } from 'zod';

export const CreateReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters long')
});

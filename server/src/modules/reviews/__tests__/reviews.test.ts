import { describe, it, expect } from 'vitest';
import { CreateReviewSchema } from '../reviews.schema';
import { ReviewsService } from '../reviews.service';

describe('Reviews Intelligence Suite', () => {
  it('should validate valid CreateReview input', () => {
    const valid = CreateReviewSchema.safeParse({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 5,
      comment: 'Outstanding quality and very fast shipping!'
    });
    expect(valid.success).toBe(true);
  });

  it('should reject rating outside 1 to 5 range', () => {
    const invalid = CreateReviewSchema.safeParse({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 6,
      comment: 'Great product'
    });
    expect(invalid.success).toBe(false);
  });

  it('should return review intelligence summary structure', async () => {
    const result = await ReviewsService.getReviewIntelligence('non-existent-id');
    expect(result).toHaveProperty('productId');
    expect(result).toHaveProperty('averageRating');
  });
});

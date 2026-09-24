import { describe, it, expect } from 'vitest';
import { SellerCopilotSchema, ApproveProductListingSchema } from '../ai.schema';
import { SQSWorker } from '../../../queue/sqsWorker';

describe('AI Module & SQS Worker Suite', () => {
  it('should validate valid SellerCopilot input schema', () => {
    const valid = SellerCopilotSchema.safeParse({
      productName: 'Wireless Noise Cancelling Headphones',
      category: 'Electronics',
      roughNotes: 'Over-ear design with 40-hour battery life and fast charging.'
    });
    expect(valid.success).toBe(true);
  });

  it('should reject SellerCopilot with too short roughNotes', () => {
    const invalid = SellerCopilotSchema.safeParse({
      productName: 'Headphones',
      category: 'Electronics',
      roughNotes: 'Short'
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate ApproveProductListing schema', () => {
    const valid = ApproveProductListingSchema.safeParse({
      productId: '123e4567-e89b-12d3-a456-426614174000'
    });
    expect(valid.success).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { AddCartItemSchema } from '../../cart/cart.schema';
import { CheckoutSchema } from '../orders.schema';

describe('Cart & Orders Zod Schemas', () => {
  it('should validate valid AddCartItem payload', () => {
    const valid = AddCartItemSchema.safeParse({
      variantId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2
    });
    expect(valid.success).toBe(true);
  });

  it('should reject non-positive cart quantity', () => {
    const invalid = AddCartItemSchema.safeParse({
      variantId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 0
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate checkout schema with UUID idempotencyKey', () => {
    const valid = CheckoutSchema.safeParse({
      idempotencyKey: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      items: [
        { variantId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1 }
      ]
    });
    expect(valid.success).toBe(true);
  });

  it('should reject checkout without idempotencyKey', () => {
    const invalid = CheckoutSchema.safeParse({
      items: [
        { variantId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1 }
      ]
    });
    expect(invalid.success).toBe(false);
  });
});

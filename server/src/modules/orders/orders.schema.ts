import { z } from 'zod';

export const CheckoutSchema = z.object({
  idempotencyKey: z.string().uuid('idempotencyKey must be a valid UUID'),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1, 'Checkout cart must contain at least 1 item')
});

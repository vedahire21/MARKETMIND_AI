import { z } from 'zod';

export const AddCartItemSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID format'),
  quantity: z.number().int().positive('Quantity must be at least 1')
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative')
});

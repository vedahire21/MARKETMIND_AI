import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN']).default('CUSTOMER'),
  storeName: z.string().optional()
}).refine(data => {
  if (data.role === 'SELLER' && !data.storeName) {
    return false;
  }
  return true;
}, {
  message: 'storeName is required when registering as a SELLER',
  path: ['storeName']
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

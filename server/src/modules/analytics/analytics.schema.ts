import { z } from 'zod';

export const AskBusinessAnalystSchema = z.object({
  query: z.string().min(3, 'Analytics query must be at least 3 characters long')
});

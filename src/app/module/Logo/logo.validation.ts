import { z } from 'zod';

export const createLogoSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    url: z.string().url(),
  }),
});

export const updateLogoSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).optional(),
    url: z.string().url().optional(),
  }),
});

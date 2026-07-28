import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code'),
});

export const updateMemberSchema = createMemberSchema.partial();

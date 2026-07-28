import { z } from 'zod';

export const createSettlementSchema = z.object({
  from_member: z.string().uuid(),
  to_member:   z.string().uuid(),
  amount:      z.number().positive(),
  status:      z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  notes:       z.string().max(500).optional(),
  settled_date:z.string().date().optional(),
}).refine(data => data.from_member !== data.to_member, {
  message: "Cannot settle with oneself",
  path: ["to_member"]
});

export const updateSettlementSchema = z.object({
  amount:       z.number().positive().optional(),
  status:       z.enum(['pending', 'completed', 'cancelled']).optional(),
  notes:        z.string().max(500).optional(),
  settled_date: z.string().date().optional(),
});

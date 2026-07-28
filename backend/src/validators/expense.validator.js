import { z } from 'zod';

export const createExpenseSchema = z.object({
  title:        z.string().min(1).max(200),
  amount:       z.number().positive(),
  category_id:  z.string().uuid(),
  split_type:   z.enum(['equal', 'exact', 'percentage']).default('equal'),
  paid_by:      z.string().uuid(),
  expense_date: z.string().date(),
  notes:        z.string().max(500).optional(),
  is_favourite: z.boolean().optional().default(false),
  participants: z.array(z.string().uuid())
    .min(1)
    .refine(
      arr => new Set(arr).size === arr.length,
      { message: 'Duplicate member in participants list' }
    ),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  page:        z.coerce.number().int().positive().default(1),
  per_page:    z.coerce.number().int().min(1).max(100).default(20),
  search:      z.string().max(200).optional(),
  category_id: z.string().uuid().optional(),
  paid_by:     z.string().uuid().optional(),
  member_id:   z.string().uuid().optional(),
  date_from:   z.string().date().optional(),
  date_to:     z.string().date().optional(),
  is_favourite:z.coerce.boolean().optional(),
  sort_by:     z.enum(['expense_date', 'amount', 'created_at']).default('expense_date'),
  sort_order:  z.enum(['asc', 'desc']).default('desc'),
}).refine(
  d => !d.date_from || !d.date_to || d.date_from <= d.date_to,
  { message: 'date_from must be before date_to', path: ['date_from'] }
);

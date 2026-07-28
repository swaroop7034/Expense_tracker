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
  participants: z.array(z.any()).min(1)
}).superRefine((data, ctx) => {
  // Validate participants array for duplicates
  const memberIds = data.participants.map(p => typeof p === 'string' ? p : p.member_id);
  if (new Set(memberIds).size !== memberIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate member in participants list', path: ['participants'] });
  }

  if (data.split_type === 'equal') {
    const isValid = data.participants.every(p => typeof p === 'string');
    if (!isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'For equal split, participants must be array of UUIDs', path: ['participants'] });
    }
  } else if (data.split_type === 'exact') {
    let sum = 0;
    const isValid = data.participants.every(p => {
      if (typeof p !== 'object' || !p.member_id || typeof p.amount !== 'number' || p.amount <= 0) return false;
      sum += p.amount;
      return true;
    });
    if (!isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'For exact split, participants must be { member_id, amount } with positive amounts', path: ['participants'] });
    } else {
      // Allow a small floating point tolerance (e.g. 0.01)
      if (Math.abs(sum - data.amount) > 0.01) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Sum of exact amounts (${sum.toFixed(2)}) must equal total amount (${data.amount.toFixed(2)})`, path: ['participants'] });
      }
    }
  }
});

// Since createExpenseSchema now has a superRefine, partial() on it acts differently in Zod.
// We have to redefine updateExpenseSchema if we want partial base fields but still want validation.
// For simplicity, we can just use the base object and partial it, then re-apply superRefine.
const baseSchema = z.object({
  title:        z.string().min(1).max(200),
  amount:       z.number().positive(),
  category_id:  z.string().uuid(),
  split_type:   z.enum(['equal', 'exact', 'percentage']).default('equal'),
  paid_by:      z.string().uuid(),
  expense_date: z.string().date(),
  notes:        z.string().max(500).optional(),
  is_favourite: z.boolean().optional().default(false),
  participants: z.array(z.any()).min(1)
});

export const updateExpenseSchema = baseSchema.partial().superRefine((data, ctx) => {
  if (data.participants) {
    const memberIds = data.participants.map(p => typeof p === 'string' ? p : p.member_id);
    if (new Set(memberIds).size !== memberIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate member in participants list', path: ['participants'] });
    }

    if (data.split_type === 'equal' || (!data.split_type && data.participants.length > 0 && typeof data.participants[0] === 'string')) {
      const isValid = data.participants.every(p => typeof p === 'string');
      if (!isValid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'For equal split, participants must be array of UUIDs', path: ['participants'] });
      }
    } else if (data.split_type === 'exact' || (!data.split_type && data.participants.length > 0 && typeof data.participants[0] === 'object')) {
      let sum = 0;
      const isValid = data.participants.every(p => {
        if (typeof p !== 'object' || !p.member_id || typeof p.amount !== 'number' || p.amount <= 0) return false;
        sum += p.amount;
        return true;
      });
      if (!isValid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'For exact split, participants must be { member_id, amount } with positive amounts', path: ['participants'] });
      } else if (data.amount !== undefined) {
        if (Math.abs(sum - data.amount) > 0.01) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Sum of exact amounts (${sum.toFixed(2)}) must equal total amount (${data.amount.toFixed(2)})`, path: ['participants'] });
        }
      }
    }
  }
});

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

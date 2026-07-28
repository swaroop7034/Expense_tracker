import { AppError } from './AppError.js';

export function mapSupabaseError(err, context = {}) {
  if (err.code === '23505') {                          // unique_violation
    if (err.message && err.message.includes('expense_participants')) {
      throw new AppError('DUPLICATE_PARTICIPANT', 409, 'A member cannot be added twice to the same expense.');
    }
    throw new AppError('DUPLICATE_ENTRY', 409, err.message);
  }
  if (err.code === '23503') {                          // foreign_key_violation
    throw new AppError('REFERENCE_NOT_FOUND', 404, err.message);
  }
  throw new AppError('DB_INSERT_FAILED', 500, err.message);
}

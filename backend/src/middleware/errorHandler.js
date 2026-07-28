import { error } from '../utils/apiResponse.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // If it's our custom AppError, use its properties
  if (err.statusCode) {
    return error(res, err);
  }

  // Handle generic errors (e.g., syntax errors, unhandled rejections)
  console.error('Unhandled Error:', err);
  return error(res, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred on the server',
  });
};

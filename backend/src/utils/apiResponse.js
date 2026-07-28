export const success = (res, data, meta = null, statusCode = 200) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const error = (res, err) => {
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: err.details || [],
    stack: err.stack
  };
  return res.status(statusCode).json({ success: false, error: errorResponse });
};

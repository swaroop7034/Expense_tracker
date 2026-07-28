import { AppError } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source] || {});
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (error) {
      console.log("VALIDATION ERROR CAUGHT:", error);
      const details = error.errors ? error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      })) : [{ message: error.message, name: error.name }];
      return next(new AppError('VALIDATION_ERROR', 400, 'Invalid request data', details));
    }
    next();
  };
};

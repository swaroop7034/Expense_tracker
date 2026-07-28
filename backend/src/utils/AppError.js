export class AppError extends Error {
  constructor(code, statusCode, message, details = []) {
    super(message);
    this.code = code;           // e.g. 'EXPENSE_NOT_FOUND'
    this.statusCode = statusCode;
    this.details = details;     // Zod field errors, etc.
  }
}

import * as expensesService from '../services/expensesService.js';
import { success } from '../utils/apiResponse.js';

export async function getExpenses(req, res, next) {
  try {
    const result = await expensesService.getExpenses(req.query);
    return success(res, result.data, {
      count: result.count,
      page: result.page,
      per_page: result.per_page,
    });
  } catch (err) {
    next(err);
  }
}

export async function getExpenseById(req, res, next) {
  try {
    const data = await expensesService.getExpenseById(req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req, res, next) {
  try {
    const data = await expensesService.createExpense(req.body);
    return success(res, data, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const data = await expensesService.updateExpense(req.params.id, req.body);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    await expensesService.deleteExpense(req.params.id);
    return success(res, { message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
}

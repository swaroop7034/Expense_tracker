import { Router } from 'express';
import * as expensesController from '../../../controllers/expensesController.js';
import { validate } from '../../../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema } from '../../../validators/expense.validator.js';

const router = Router();

router.get('/', validate(listExpensesQuerySchema, 'query'), expensesController.getExpenses);
router.get('/:id', expensesController.getExpenseById);
router.post('/', validate(createExpenseSchema), expensesController.createExpense);
router.put('/:id', validate(updateExpenseSchema), expensesController.updateExpense);
router.delete('/:id', expensesController.deleteExpense);

export default router;

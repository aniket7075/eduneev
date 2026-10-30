import { Router } from 'express';
import {
  getAllExpenses, getExpenseById, createExpense, updateExpense, deleteExpense,
  getExpenseSummary, getCategories, createCategory, deleteCategory,
} from '../controllers/expenses.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Summary
router.get('/summary', getExpenseSummary);

// Categories
router.get('/categories',        getCategories);
router.post('/categories',       createCategory);
router.delete('/categories/:id', deleteCategory);

// Expenses CRUD
router.get('/',       getAllExpenses);
router.get('/:id',    getExpenseById);
router.post('/',      createExpense);
router.put('/:id',    updateExpense);
router.delete('/:id', deleteExpense);

export default router;

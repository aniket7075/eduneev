"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenses_controller_1 = require("../controllers/expenses.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Summary
router.get('/summary', expenses_controller_1.getExpenseSummary);
// Categories
router.get('/categories', expenses_controller_1.getCategories);
router.post('/categories', expenses_controller_1.createCategory);
router.delete('/categories/:id', expenses_controller_1.deleteCategory);
// Expenses CRUD
router.get('/', expenses_controller_1.getAllExpenses);
router.get('/:id', expenses_controller_1.getExpenseById);
router.post('/', expenses_controller_1.createExpense);
router.put('/:id', expenses_controller_1.updateExpense);
router.delete('/:id', expenses_controller_1.deleteExpense);
exports.default = router;

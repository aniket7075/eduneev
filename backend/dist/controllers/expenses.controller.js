"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = exports.getExpenseSummary = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenseById = exports.getAllExpenses = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// ─── GET ALL EXPENSES ─────────────────────────────────────────────────────────
const getAllExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category_id, month, year, payment_method } = req.query;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (!isSuper && !resolvedSchoolId) {
            res.status(200).json({ data: [], total: 0 });
            return;
        }
        let query = `
      SELECT e.*,
             COALESCE(ec.name, e.category, 'General') AS category_name,
             ec.color AS category_color,
             ec.icon AS category_icon,
             sch.name AS school_name,
             COALESCE(u.first_name || ' ' || u.last_name, e.notes, 'Branch Admin') AS recorded_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.recorded_by = u.id
      LEFT JOIN schools sch ON e.school_id = sch.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND e.school_id = $${idx++}`;
            params.push(resolvedSchoolId);
        }
        if (category_id) {
            query += ` AND e.category_id = $${idx++}`;
            params.push(category_id);
        }
        if (payment_method) {
            query += ` AND e.payment_method = $${idx++}`;
            params.push(payment_method);
        }
        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM COALESCE(e.expense_date, e.date)) = $${idx++} AND EXTRACT(YEAR FROM COALESCE(e.expense_date, e.date)) = $${idx++}`;
            params.push(month, year);
        }
        else if (year) {
            query += ` AND EXTRACT(YEAR FROM COALESCE(e.expense_date, e.date)) = $${idx++}`;
            params.push(year);
        }
        query += ' ORDER BY COALESCE(e.expense_date, e.date) DESC';
        const result = yield database_1.pool.query(query, params);
        // Compute totals
        const totalRes = yield database_1.pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE ($1::uuid IS NULL OR school_id = $1)`, [resolvedSchoolId || null]);
        res.status(200).json({ data: result.rows, total: totalRes.rows[0].total });
    }
    catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllExpenses = getAllExpenses;
// ─── GET EXPENSE BY ID ────────────────────────────────────────────────────────
const getExpenseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query(`SELECT e.*, COALESCE(ec.name, e.category, 'General') AS category_name, ec.color AS category_color
       FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.status(200).json({ data: result.rows[0] });
    }
    catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getExpenseById = getExpenseById;
// ─── CREATE EXPENSE ───────────────────────────────────────────────────────────
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, category_id, payment_method, vendor_name, receipt_url, notes, school_id } = req.body;
        const categoryName = req.body.category || 'General';
        const title = req.body.title || req.body.description || categoryName;
        const descriptionText = req.body.description || notes || '';
        const expenseDate = req.body.expense_date || req.body.date || new Date().toISOString().split('T')[0];
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
        if (!amount) {
            res.status(400).json({ error: 'amount is required' });
            return;
        }
        let resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        const approvedNotes = req.body.approvedBy ? `Approved by ${req.body.approvedBy}` : notes || descriptionText;
        const result = yield database_1.pool.query(`INSERT INTO expenses
         (school_id, category_id, category, title, description, amount, expense_date, date,
          payment_method, vendor_name, receipt_url, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`, [
            resolvedSchoolId,
            category_id || null,
            categoryName,
            title,
            descriptionText,
            parseFloat(amount),
            expenseDate,
            expenseDate,
            payment_method || 'cash',
            vendor_name || null,
            receipt_url || null,
            approvedNotes || null,
            userId,
        ]);
        res.status(201).json({ message: 'Expense recorded successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createExpense = createExpense;
// ─── UPDATE EXPENSE ───────────────────────────────────────────────────────────
const updateExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, amount, expense_date, category_id, payment_method, vendor_name, receipt_url, notes } = req.body;
        const result = yield database_1.pool.query(`UPDATE expenses SET
         title          = COALESCE($1, title),
         amount         = COALESCE($2, amount),
         expense_date   = COALESCE($3, expense_date),
         category_id    = COALESCE($4, category_id),
         payment_method = COALESCE($5, payment_method),
         vendor_name    = COALESCE($6, vendor_name),
         receipt_url    = COALESCE($7, receipt_url),
         notes          = COALESCE($8, notes),
         updated_at     = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`, [(title !== undefined ? title : null), (amount !== undefined && amount !== null ? parseFloat(amount) : null), expense_date,
            category_id, payment_method, vendor_name, receipt_url, notes, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.status(200).json({ message: 'Expense updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateExpense = updateExpense;
// ─── DELETE EXPENSE ───────────────────────────────────────────────────────────
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.status(200).json({ message: 'Expense deleted' });
    }
    catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteExpense = deleteExpense;
// ─── GET EXPENSE SUMMARY (by category & month) ───────────────────────────────
const getExpenseSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id, year } = req.query;
        const targetYear = year || new Date().getFullYear();
        const byCategoryRes = yield database_1.pool.query(`SELECT ec.name, ec.color, COALESCE(SUM(e.amount), 0) AS total
       FROM expense_categories ec
       LEFT JOIN expenses e ON ec.id = e.category_id
         AND EXTRACT(YEAR FROM e.expense_date) = $1
         AND ($2::uuid IS NULL OR e.school_id = $2::uuid)
       WHERE ec.school_id = $2 OR $2 IS NULL
       GROUP BY ec.id, ec.name, ec.color
       ORDER BY total DESC`, [targetYear, school_id || null]);
        const byMonthRes = yield database_1.pool.query(`SELECT EXTRACT(MONTH FROM expense_date) AS month,
              COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE EXTRACT(YEAR FROM expense_date) = $1
         AND ($2::uuid IS NULL OR school_id = $2::uuid)
       GROUP BY month ORDER BY month`, [targetYear, school_id || null]);
        res.status(200).json({ by_category: byCategoryRes.rows, by_month: byMonthRes.rows });
    }
    catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getExpenseSummary = getExpenseSummary;
// ─── EXPENSE CATEGORIES CRUD ──────────────────────────────────────────────────
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.query;
        let query = 'SELECT * FROM expense_categories WHERE 1=1';
        const params = [];
        if (school_id) {
            query += ' AND school_id = $1';
            params.push(school_id);
        }
        query += ' ORDER BY name ASC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getCategories = getCategories;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, color, icon, school_id } = req.body;
        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        const result = yield database_1.pool.query(`INSERT INTO expense_categories (school_id, name, color, icon) VALUES ($1,$2,$3,$4) RETURNING *`, [resolvedSchoolId, name, color || '#6366F1', icon || 'receipt']);
        res.status(201).json({ message: 'Category created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createCategory = createCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.pool.query('DELETE FROM expense_categories WHERE id = $1', [id]);
        res.status(200).json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteCategory = deleteCategory;

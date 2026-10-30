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
exports.getExpenseSummary = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = void 0;
const auth_middleware_1 = require("../middlewares/auth.middleware");
const database_1 = require("../config/database");
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `
      SELECT e.*,
             COALESCE(e.date, e.expense_date) AS date,
             u.first_name || ' ' || u.last_name AS recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE 1=1
    `;
        const params = [];
        if (!isSuper && tenantSchoolId) {
            query += ` AND (e.school_id = $1 OR e.school_id IS NULL)`;
            params.push(tenantSchoolId);
        }
        else if (tenantSchoolId) {
            query += ` AND e.school_id = $1`;
            params.push(tenantSchoolId);
        }
        query += ` ORDER BY COALESCE(e.date, e.expense_date, e.created_at) DESC`;
        const { rows } = yield database_1.pool.query(query, params);
        res.json({ data: rows });
    }
    catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getExpenses = getExpenses;
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let schoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id);
        if (!schoolId) {
            const sRes = yield database_1.pool.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
            if (sRes.rows.length > 0)
                schoolId = sRes.rows[0].id;
        }
        const { title, amount, category, date, expense_date, description, vendor_id, vendor_name, payment_method, notes, receipt_url } = req.body;
        const recorded_by = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const finalDate = date || expense_date || new Date().toISOString().split('T')[0];
        const finalTitle = title || description || `${category || 'General'} Expense`;
        const { rows } = yield database_1.pool.query(`INSERT INTO expenses 
        (school_id, title, amount, category, date, expense_date, description, vendor_id, vendor_name, payment_method, notes, recorded_by, receipt_url) 
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`, [
            schoolId, finalTitle, Number(amount), category || 'Stationery',
            finalDate, description || finalTitle, vendor_id || null,
            vendor_name || null, payment_method || 'Cash', notes || null,
            recorded_by || null, receipt_url || null
        ]);
        res.status(201).json({ message: 'Expense added successfully', data: rows[0] });
    }
    catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createExpense = createExpense;
const updateExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, amount, category, date, expense_date, description, payment_method, notes, vendor_name } = req.body;
        const finalDate = date || expense_date || null;
        const { rows } = yield database_1.pool.query(`UPDATE expenses SET
         title = COALESCE($1, title),
         amount = COALESCE($2, amount),
         category = COALESCE($3, category),
         date = COALESCE($4, date),
         expense_date = COALESCE($4, expense_date),
         description = COALESCE($5, description),
         payment_method = COALESCE($6, payment_method),
         notes = COALESCE($7, notes),
         vendor_name = COALESCE($8, vendor_name)
       WHERE id = $9 RETURNING *`, [
            title || null, amount ? Number(amount) : null, category || null,
            finalDate, description || null, payment_method || null,
            notes || null, vendor_name || null, id
        ]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.json({ message: 'Expense updated successfully', data: rows[0] });
    }
    catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateExpense = updateExpense;
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteExpense = deleteExpense;
const getExpenseSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `SELECT category, SUM(amount) as total FROM expenses WHERE 1=1`;
        const params = [];
        if (!isSuper && tenantSchoolId) {
            query += ` AND (school_id = $1 OR school_id IS NULL)`;
            params.push(tenantSchoolId);
        }
        else if (tenantSchoolId) {
            query += ` AND school_id = $1`;
            params.push(tenantSchoolId);
        }
        query += ` GROUP BY category`;
        const { rows } = yield database_1.pool.query(query, params);
        const total = rows.reduce((acc, row) => acc + Number(row.total), 0);
        res.json({ total, byCategory: rows });
    }
    catch (error) {
        console.error('Error fetching expense summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getExpenseSummary = getExpenseSummary;

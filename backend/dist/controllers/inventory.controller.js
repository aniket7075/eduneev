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
exports.deleteOrder = exports.updateOrderStatus = exports.createOrder = exports.getAllOrders = exports.adjustStock = exports.deleteItem = exports.updateItem = exports.createItem = exports.getItemById = exports.getAllItems = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// ─── GET ALL INVENTORY ITEMS ──────────────────────────────────────────────────
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, low_stock } = req.query;
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        if (!isSuper && !resolvedSchoolId) {
            res.status(200).json({ data: [] });
            return;
        }
        let query = `SELECT *, COALESCE(current_stock, quantity, 0) AS current_stock, COALESCE(minimum_stock, min_threshold, 5) AS minimum_stock FROM inventory_items WHERE 1=1`;
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND (school_id = $${idx} OR school_id IS NULL)`;
            params.push(resolvedSchoolId);
            idx++;
        }
        if (category) {
            query += ` AND category = $${idx++}`;
            params.push(category);
        }
        if (low_stock === 'true') {
            query += ` AND COALESCE(current_stock, quantity, 0) <= COALESCE(minimum_stock, min_threshold, 5)`;
        }
        query += ' ORDER BY name ASC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get inventory items error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllItems = getAllItems;
// ─── GET ITEM BY ID ───────────────────────────────────────────────────────────
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield database_1.pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
        if (item.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        // Get recent transactions
        const txns = yield database_1.pool.query(`SELECT it.*, u.first_name || ' ' || u.last_name AS done_by_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.done_by = u.id
       WHERE it.item_id = $1
       ORDER BY it.created_at DESC LIMIT 20`, [id]);
        res.status(200).json({ data: Object.assign(Object.assign({}, item.rows[0]), { transactions: txns.rows }) });
    }
    catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getItemById = getItemById;
// ─── CREATE ITEM ──────────────────────────────────────────────────────────────
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, sku, description, current_stock, minimum_stock, unit, unit_price, supplier_name, school_id } = req.body;
        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id || null;
        const result = yield database_1.pool.query(`INSERT INTO inventory_items
         (school_id, name, category, sku, description, current_stock,
          minimum_stock, unit, unit_price, supplier_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`, [
            resolvedSchoolId, name, category || 'General',
            sku || null, description || null,
            parseInt(current_stock) || 0, parseInt(minimum_stock) || 5,
            unit || 'pcs', unit_price ? parseFloat(unit_price) : null,
            supplier_name || null,
        ]);
        res.status(201).json({ message: 'Inventory item created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createItem = createItem;
// ─── UPDATE ITEM ──────────────────────────────────────────────────────────────
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, category, sku, description, minimum_stock, unit, unit_price, supplier_name } = req.body;
        const result = yield database_1.pool.query(`UPDATE inventory_items SET
         name          = COALESCE($1, name),
         category      = COALESCE($2, category),
         sku           = COALESCE($3, sku),
         description   = COALESCE($4, description),
         minimum_stock = COALESCE($5, minimum_stock),
         unit          = COALESCE($6, unit),
         unit_price    = COALESCE($7, unit_price),
         supplier_name = COALESCE($8, supplier_name),
         updated_at    = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`, [name, category, sku, description,
            minimum_stock ? parseInt(minimum_stock) : null,
            unit, unit_price ? parseFloat(unit_price) : null,
            supplier_name, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        res.status(200).json({ message: 'Item updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateItem = updateItem;
// ─── DELETE ITEM ──────────────────────────────────────────────────────────────
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        res.status(200).json({ message: 'Item deleted' });
    }
    catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteItem = deleteItem;
// ─── ADJUST STOCK (stock_in / stock_out) ─────────────────────────────────────
const adjustStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { id } = req.params;
        const { transaction_type, quantity, notes } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!transaction_type || !quantity) {
            res.status(400).json({ error: 'transaction_type and quantity are required' });
            return;
        }
        if (!['stock_in', 'stock_out', 'adjustment'].includes(transaction_type)) {
            res.status(400).json({ error: 'Invalid transaction_type' });
            return;
        }
        yield client.query('BEGIN');
        // Check current stock for stock_out
        const item = yield client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [id]);
        if (item.rows.length === 0) {
            throw new Error('Item not found');
        }
        const qty = parseInt(quantity);
        const currentStock = item.rows[0].current_stock;
        if (transaction_type === 'stock_out' && currentStock < qty) {
            res.status(400).json({ error: `Insufficient stock. Available: ${currentStock}` });
            yield client.query('ROLLBACK');
            return;
        }
        // Update stock
        const delta = transaction_type === 'stock_out' ? -qty : qty;
        const updatedItem = yield client.query(`UPDATE inventory_items
       SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`, [delta, id]);
        // Log transaction
        yield client.query(`INSERT INTO inventory_transactions (item_id, transaction_type, quantity, notes, done_by)
       VALUES ($1,$2,$3,$4,$5)`, [id, transaction_type, qty, notes || null, userId]);
        yield client.query('COMMIT');
        res.status(200).json({ message: 'Stock adjusted', data: updatedItem.rows[0] });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Adjust stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.adjustStock = adjustStock;
// ─── GET ALL ORDERS ───────────────────────────────────────────────────────────
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { school_id, status } = req.query;
        let resolvedSchoolId = school_id || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id);
        if (!resolvedSchoolId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'super_admin' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
            const sRes = yield database_1.pool.query(`SELECT school_id FROM user_schools WHERE user_id = $1 
         UNION 
         SELECT school_id FROM staff_profiles WHERE user_id = $1 
         LIMIT 1`, [req.user.id]);
            if (sRes.rows.length > 0)
                resolvedSchoolId = sRes.rows[0].school_id;
        }
        let query = `
      SELECT io.*,
             ii.name AS item_name, ii.unit,
             u1.first_name || ' ' || u1.last_name AS requested_by_name,
             u2.first_name || ' ' || u2.last_name AS approved_by_name
      FROM inventory_orders io
      JOIN inventory_items ii ON io.item_id = ii.id
      LEFT JOIN users u1 ON io.requested_by = u1.id
      LEFT JOIN users u2 ON io.approved_by = u2.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND io.school_id = $${idx++}`;
            params.push(resolvedSchoolId);
        }
        if (status) {
            query += ` AND io.status = $${idx++}`;
            params.push(status);
        }
        query += ' ORDER BY io.created_at DESC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllOrders = getAllOrders;
// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { item_id, quantity_requested, priority, notes, school_id, expected_delivery } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!item_id || !quantity_requested) {
            res.status(400).json({ error: 'item_id and quantity_requested are required' });
            return;
        }
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        const result = yield database_1.pool.query(`INSERT INTO inventory_orders
         (school_id, item_id, quantity_requested, priority, notes, requested_by, expected_delivery)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`, [
            resolvedSchoolId, item_id, parseInt(quantity_requested),
            priority || 'normal', notes || null, userId,
            expected_delivery || null,
        ]);
        res.status(201).json({ message: 'Order placed', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createOrder = createOrder;
// ─── UPDATE ORDER STATUS (approve / dispatch / receive / cancel) ──────────────
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { id } = req.params;
        const { status, quantity_approved, admin_notes } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const validStatuses = ['approved', 'dispatched', 'received', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }
        yield client.query('BEGIN');
        const updated = yield client.query(`UPDATE inventory_orders SET
         status           = $1,
         quantity_approved = COALESCE($2, quantity_approved),
         admin_notes      = COALESCE($3, admin_notes),
         approved_by      = CASE WHEN $1 = 'approved' THEN $4 ELSE approved_by END,
         updated_at       = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`, [status, quantity_approved || null, admin_notes || null, userId, id]);
        if (updated.rows.length === 0) {
            throw new Error('Order not found');
        }
        // If received, update stock
        if (status === 'received') {
            const order = updated.rows[0];
            const receivedQty = order.quantity_approved || order.quantity_requested;
            yield client.query(`UPDATE inventory_items SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [receivedQty, order.item_id]);
            yield client.query(`INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_order_id, notes, done_by)
         VALUES ($1, 'stock_in', $2, $3, 'Order received', $4)`, [order.item_id, receivedQty, id, userId]);
        }
        yield client.query('COMMIT');
        res.status(200).json({ message: `Order ${status}`, data: updated.rows[0] });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.updateOrderStatus = updateOrderStatus;
// ─── DELETE ORDER ─────────────────────────────────────────────────────────────
const deleteOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const order = yield database_1.pool.query(`SELECT status FROM inventory_orders WHERE id = $1`, [id]);
        if (order.rows.length === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        if (['dispatched', 'received'].includes(order.rows[0].status)) {
            res.status(400).json({ error: 'Cannot delete dispatched/received orders' });
            return;
        }
        yield database_1.pool.query('DELETE FROM inventory_orders WHERE id = $1', [id]);
        res.status(200).json({ message: 'Order deleted' });
    }
    catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteOrder = deleteOrder;

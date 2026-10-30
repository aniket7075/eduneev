import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

// ─── GET ALL INVENTORY ITEMS ──────────────────────────────────────────────────
export const getAllItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, low_stock } = req.query;
    const isSuper = isSuperAdminUser(req);
    const resolvedSchoolId = getTenantSchoolId(req);

    if (!isSuper && !resolvedSchoolId) {
      res.status(200).json({ data: [] });
      return;
    }

    let query = `SELECT *, COALESCE(current_stock, quantity, 0) AS current_stock, COALESCE(minimum_stock, min_threshold, 5) AS minimum_stock FROM inventory_items WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (resolvedSchoolId) { query += ` AND (school_id = $${idx} OR school_id IS NULL)`; params.push(resolvedSchoolId); idx++; }
    if (category)         { query += ` AND category = $${idx++}`;  params.push(category); }
    if (low_stock === 'true') { query += ` AND COALESCE(current_stock, quantity, 0) <= COALESCE(minimum_stock, min_threshold, 5)`; }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET ITEM BY ID ───────────────────────────────────────────────────────────
export const getItemById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (item.rows.length === 0) { res.status(404).json({ error: 'Item not found' }); return; }

    // Get recent transactions
    const txns = await pool.query(
      `SELECT it.*, u.first_name || ' ' || u.last_name AS done_by_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.done_by = u.id
       WHERE it.item_id = $1
       ORDER BY it.created_at DESC LIMIT 20`,
      [id]
    );

    res.status(200).json({ data: { ...item.rows[0], transactions: txns.rows } });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE ITEM ──────────────────────────────────────────────────────────────
export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, sku, description, current_stock, minimum_stock,
            unit, unit_price, supplier_name, school_id } = req.body;

    if (!name) { res.status(400).json({ error: 'name is required' }); return; }

    const resolvedSchoolId = getTenantSchoolId(req) || school_id || null;

    const result = await pool.query(
      `INSERT INTO inventory_items
         (school_id, name, category, sku, description, current_stock,
          minimum_stock, unit, unit_price, supplier_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        resolvedSchoolId, name, category || 'General',
        sku || null, description || null,
        parseInt(current_stock) || 0, parseInt(minimum_stock) || 5,
        unit || 'pcs', unit_price ? parseFloat(unit_price) : null,
        supplier_name || null,
      ]
    );

    res.status(201).json({ message: 'Inventory item created', data: result.rows[0] });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── UPDATE ITEM ──────────────────────────────────────────────────────────────
export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, sku, description, minimum_stock, unit, unit_price, supplier_name } = req.body;

    const result = await pool.query(
      `UPDATE inventory_items SET
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
       RETURNING *`,
      [name, category, sku, description,
       minimum_stock ? parseInt(minimum_stock) : null,
       unit, unit_price ? parseFloat(unit_price) : null,
       supplier_name, id]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'Item not found' }); return; }
    res.status(200).json({ message: 'Item updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE ITEM ──────────────────────────────────────────────────────────────
export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Item not found' }); return; }
    res.status(200).json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── ADJUST STOCK (stock_in / stock_out) ─────────────────────────────────────
export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { transaction_type, quantity, notes } = req.body;
    const userId = req.user?.id;

    if (!transaction_type || !quantity) {
      res.status(400).json({ error: 'transaction_type and quantity are required' });
      return;
    }
    if (!['stock_in', 'stock_out', 'adjustment'].includes(transaction_type)) {
      res.status(400).json({ error: 'Invalid transaction_type' });
      return;
    }

    await client.query('BEGIN');

    // Check current stock for stock_out
    const item = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [id]);
    if (item.rows.length === 0) { throw new Error('Item not found'); }

    const qty = parseInt(quantity);
    const currentStock = item.rows[0].current_stock;

    if (transaction_type === 'stock_out' && currentStock < qty) {
      res.status(400).json({ error: `Insufficient stock. Available: ${currentStock}` });
      await client.query('ROLLBACK');
      return;
    }

    // Update stock
    const delta = transaction_type === 'stock_out' ? -qty : qty;
    const updatedItem = await client.query(
      `UPDATE inventory_items
       SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [delta, id]
    );

    // Log transaction
    await client.query(
      `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, notes, done_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, transaction_type, qty, notes || null, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Stock adjusted', data: updatedItem.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── GET ALL ORDERS ───────────────────────────────────────────────────────────
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id, status } = req.query;

    let resolvedSchoolId = school_id || req.user?.school_id;
    if (!resolvedSchoolId && req.user?.role !== 'super_admin' && req.user?.id) {
      const sRes = await pool.query(
        `SELECT school_id FROM user_schools WHERE user_id = $1 
         UNION 
         SELECT school_id FROM staff_profiles WHERE user_id = $1 
         LIMIT 1`, 
        [req.user.id]
      );
      if (sRes.rows.length > 0) resolvedSchoolId = sRes.rows[0].school_id;
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
    const params: any[] = [];
    let idx = 1;

    if (resolvedSchoolId) { query += ` AND io.school_id = $${idx++}`; params.push(resolvedSchoolId); }
    if (status)           { query += ` AND io.status = $${idx++}`;    params.push(status); }

    query += ' ORDER BY io.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item_id, quantity_requested, priority, notes, school_id, expected_delivery } = req.body;
    const userId = req.user?.id;

    if (!item_id || !quantity_requested) {
      res.status(400).json({ error: 'item_id and quantity_requested are required' });
      return;
    }

    let resolvedSchoolId = school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO inventory_orders
         (school_id, item_id, quantity_requested, priority, notes, requested_by, expected_delivery)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        resolvedSchoolId, item_id, parseInt(quantity_requested),
        priority || 'normal', notes || null, userId,
        expected_delivery || null,
      ]
    );

    res.status(201).json({ message: 'Order placed', data: result.rows[0] });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── UPDATE ORDER STATUS (approve / dispatch / receive / cancel) ──────────────
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, quantity_approved, admin_notes } = req.body;
    const userId = req.user?.id;

    const validStatuses = ['approved', 'dispatched', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE inventory_orders SET
         status           = $1,
         quantity_approved = COALESCE($2, quantity_approved),
         admin_notes      = COALESCE($3, admin_notes),
         approved_by      = CASE WHEN $1 = 'approved' THEN $4 ELSE approved_by END,
         updated_at       = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, quantity_approved || null, admin_notes || null, userId, id]
    );

    if (updated.rows.length === 0) { throw new Error('Order not found'); }

    // If received, update stock
    if (status === 'received') {
      const order = updated.rows[0];
      const receivedQty = order.quantity_approved || order.quantity_requested;

      await client.query(
        `UPDATE inventory_items SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [receivedQty, order.item_id]
      );

      await client.query(
        `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_order_id, notes, done_by)
         VALUES ($1, 'stock_in', $2, $3, 'Order received', $4)`,
        [order.item_id, receivedQty, id, userId]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: `Order ${status}`, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── DELETE ORDER ─────────────────────────────────────────────────────────────
export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await pool.query(`SELECT status FROM inventory_orders WHERE id = $1`, [id]);
    if (order.rows.length === 0) { res.status(404).json({ error: 'Order not found' }); return; }
    if (['dispatched', 'received'].includes(order.rows[0].status)) {
      res.status(400).json({ error: 'Cannot delete dispatched/received orders' });
      return;
    }
    await pool.query('DELETE FROM inventory_orders WHERE id = $1', [id]);
    res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

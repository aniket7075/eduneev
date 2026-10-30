import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

// ─── GET ALL BRANCHES (super_admin view or single branch view) ──────────────────────────────
export const getAllBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuper = isSuperAdminUser(req);
    const userSchoolId = getTenantSchoolId(req);

    // Check if schools exist, if not seed the 3 official EduNeev branches
    const checkSchools = await pool.query('SELECT COUNT(*) FROM schools');
    if (parseInt(checkSchools.rows[0].count || '0') === 0) {
      await pool.query(`
        INSERT INTO schools (name, address, city, state, contact_phone) VALUES
        ('Chinchwad Branch', 'RL-32, G Block, Sambhajinagar, Chinchwad', 'Chinchwad', 'Maharashtra', '9889883033'),
        ('Chikhali Branch', 'Pingale Chowk, Behind Imperial Hospital, Chikhali', 'Chikhali', 'Maharashtra', '9970841748'),
        ('Dudulgaon Branch', 'Survey No 64, S.P College Road, Dudulgaon', 'Dudulgaon', 'Maharashtra', '9960893010')
      `);
    }

    let whereClause = '';
    const params: any[] = [];
    if (!isSuper && userSchoolId) {
      whereClause = 'WHERE s.id = $1';
      params.push(userSchoolId);
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    const result = await pool.query(`
      SELECT s.*,
             COALESCE(fs.royalty_percentage, 10) AS royalty_percentage,
             fs.is_franchise_branch, fs.brand_name,
             (SELECT COUNT(*) 
              FROM students st 
              WHERE st.is_active = true 
                AND st.school_id = s.id
             ) AS student_count,
             (SELECT COUNT(DISTINCT u.id) 
              FROM users u 
              LEFT JOIN user_schools us ON us.user_id = u.id 
              LEFT JOIN staff_profiles sp ON sp.user_id = u.id
              WHERE u.is_active = true 
                AND u.role::text IN ('teacher', 'non_teaching_staff')
                AND (us.school_id = s.id OR u.school_id = s.id OR sp.school_id = s.id)
             ) AS teacher_count,
             (SELECT COALESCE(SUM(p.amount_paid), 0)
              FROM payments p
              JOIN student_fees sf ON p.student_fee_id = sf.id
              JOIN students st ON sf.student_id = st.id
              WHERE st.school_id = s.id
                AND EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
             ) AS monthly_revenue,
             (SELECT COALESCE(SUM(p.amount_paid), 0)
              FROM payments p
              JOIN student_fees sf ON p.student_fee_id = sf.id
              JOIN students st ON sf.student_id = st.id
              WHERE st.school_id = s.id
             ) AS total_revenue
      FROM schools s
      LEFT JOIN franchise_settings fs ON fs.school_id = s.id
      ${whereClause}
      ORDER BY s.created_at ASC
    `, params);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET BRANCH BY ID ─────────────────────────────────────────────────────────
export const getBranchById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isSuper = isSuperAdminUser(req);
    if (!isSuper && req.user?.school_id && String(req.user.school_id) !== String(id)) {
      res.status(403).json({ error: 'Access denied. You can only view your own franchise branch.' });
      return;
    }

    const school = await pool.query(
      `SELECT s.*, fs.* FROM schools s LEFT JOIN franchise_settings fs ON fs.school_id = s.id WHERE s.id = $1`,
      [id]
    );
    if (school.rows.length === 0) { res.status(404).json({ error: 'Branch not found' }); return; }

    const royalty = await pool.query(
      `SELECT * FROM royalty_records WHERE school_id = $1 ORDER BY period_year DESC, period_month DESC LIMIT 12`,
      [id]
    ).catch(() => ({ rows: [] }));

    res.status(200).json({ data: { ...school.rows[0], royalty_history: royalty.rows } });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE BRANCH (school) ───────────────────────────────────────────────────
export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      name, registration_number, address, city, state, zip_code,
      contact_email, contact_phone, logo_url,
      royalty_percentage, franchise_start_date, contract_end_date,
      head_office_school_id, brand_name,
      latitude, longitude, geofence_radius
    } = req.body;

    if (!name || !address || !city || !state) {
      res.status(400).json({ error: 'name, address, city, state are required' });
      return;
    }

    await client.query('BEGIN');

    // Create school
    const schoolRes = await client.query(
      `INSERT INTO schools (name, registration_number, address, city, state, zip_code, contact_email, contact_phone, logo_url, latitude, longitude, geofence_radius)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, registration_number || null, address, city, state,
       zip_code || null, contact_email || null, contact_phone || null, logo_url || null,
       latitude || null, longitude || null, geofence_radius || 200]
    );
    const newSchool = schoolRes.rows[0];

    // Create franchise settings
    await client.query(
      `INSERT INTO franchise_settings
         (school_id, royalty_percentage, is_franchise_branch, head_office_school_id, brand_name, franchise_start_date, contract_end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        newSchool.id, royalty_percentage || 10,
        head_office_school_id ? true : false,
        head_office_school_id || null, brand_name || null,
        franchise_start_date || null, contract_end_date || null,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Branch created', data: newSchool });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── UPDATE BRANCH ────────────────────────────────────────────────────────────
export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name, address, city, state, zip_code, contact_email, contact_phone,
      royalty_percentage, franchise_start_date, contract_end_date, brand_name,
      latitude, longitude, geofence_radius
    } = req.body;

    await client.query('BEGIN');

    const schoolRes = await client.query(
      `UPDATE schools SET
         name            = COALESCE($1, name),
         address         = COALESCE($2, address),
         city            = COALESCE($3, city),
         state           = COALESCE($4, state),
         zip_code        = COALESCE($5, zip_code),
         contact_email   = COALESCE($6, contact_email),
         contact_phone   = COALESCE($7, contact_phone),
         latitude        = COALESCE($8, latitude),
         longitude       = COALESCE($9, longitude),
         geofence_radius = COALESCE($10, geofence_radius),
         updated_at      = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [name, address, city, state, zip_code, contact_email, contact_phone,
       latitude !== undefined ? latitude : null,
       longitude !== undefined ? longitude : null,
       geofence_radius !== undefined ? geofence_radius : null,
       id]
    );

    if (schoolRes.rows.length === 0) { throw new Error('Branch not found'); }

    await client.query(
      `UPDATE franchise_settings SET
         royalty_percentage   = COALESCE($1, royalty_percentage),
         franchise_start_date = COALESCE($2, franchise_start_date),
         contract_end_date    = COALESCE($3, contract_end_date),
         brand_name           = COALESCE($4, brand_name),
         updated_at           = CURRENT_TIMESTAMP
       WHERE school_id = $5`,
      [royalty_percentage, franchise_start_date, contract_end_date, brand_name, id]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Branch updated', data: schoolRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── DELETE BRANCH ────────────────────────────────────────────────────────────
export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM schools WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Branch not found' }); return; }
    res.status(200).json({ message: 'Branch deleted' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── UPDATE BRANCH GEOFENCE & LOCATION ───────────────────────────────────────
export const updateBranchGeofence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { latitude, longitude, geofence_radius } = req.body;
    const isSuper = isSuperAdminUser(req);
    const tenantSchoolId = getTenantSchoolId(req);

    if (!isSuper && tenantSchoolId && String(tenantSchoolId) !== String(id)) {
      res.status(403).json({ error: 'Access denied: You can only configure geofence for your own branch.' });
      return;
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      res.status(400).json({ error: 'Latitude and Longitude are required' });
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'Invalid latitude or longitude values' });
      return;
    }

    const radius = geofence_radius ? parseInt(geofence_radius, 10) : 200;

    const result = await pool.query(
      `UPDATE schools 
       SET latitude = $1, longitude = $2, geofence_radius = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, latitude, longitude, geofence_radius`,
      [latNum, lngNum, radius, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    res.status(200).json({
      message: `Geofence location updated successfully for ${result.rows[0].name}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update branch geofence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET ROYALTY RECORDS ──────────────────────────────────────────────────────
export const getRoyaltyRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuper = isSuperAdminUser(req);
    const userSchoolId = req.user?.school_id;
    const { school_id, status, year } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let idx = 1;

    if (!isSuper && userSchoolId) {
      whereClause = `WHERE s.id = $${idx++}`;
      params.push(userSchoolId);
    } else if (school_id) {
      whereClause = `WHERE s.id = $${idx++}`;
      params.push(school_id);
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const query = `
      SELECT 
        s.id AS school_id,
        s.name AS school_name,
        COALESCE(rr.id::text, 'realtime-' || s.id) AS id,
        COALESCE(rr.period_month, ${currentMonth}) AS period_month,
        COALESCE(rr.period_year, ${currentYear}) AS period_year,
        COALESCE(
          TO_CHAR(TO_DATE(rr.period_month::text, 'MM'), 'Month') || ' ' || rr.period_year::text,
          TO_CHAR(CURRENT_DATE, 'Month YYYY')
        ) AS month_name,
        COALESCE(rr.total_revenue, 
          (SELECT COALESCE(SUM(p.amount_paid), 0)
           FROM payments p
           JOIN student_fees sf ON p.student_fee_id = sf.id
           JOIN students st ON sf.student_id = st.id
           WHERE (st.school_id = s.id OR (st.school_id IS NULL AND s.name LIKE '%Chinchwad%'))
             AND EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
          )
        ) AS total_revenue,
        COALESCE(rr.royalty_percentage, fs.royalty_percentage, 10) AS royalty_percentage,
        COALESCE(rr.royalty_amount, 
          ROUND(
            ((SELECT COALESCE(SUM(p.amount_paid), 0)
              FROM payments p
              JOIN student_fees sf ON p.student_fee_id = sf.id
              JOIN students st ON sf.student_id = st.id
              WHERE (st.school_id = s.id OR (st.school_id IS NULL AND s.name LIKE '%Chinchwad%'))
                AND EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
             ) * COALESCE(fs.royalty_percentage, 10)) / 100
          )
        ) AS royalty_amount,
        COALESCE(rr.status, 'PENDING_APPROVAL') AS status,
        COALESCE(rr.payment_method, 'Direct NEFT / RTGS') AS payment_method,
        COALESCE(rr.payment_reference, 'Ref #N/A') AS payment_reference,
        rr.proof_url
      FROM schools s
      LEFT JOIN franchise_settings fs ON fs.school_id = s.id
      LEFT JOIN royalty_records rr ON rr.school_id = s.id 
        AND rr.period_month = ${currentMonth}
        AND rr.period_year = ${currentYear}
      ${whereClause}
      ORDER BY s.created_at ASC
    `;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get royalty records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE ROYALTY RECORD ────────────────────────────────────────────────────
export const createRoyaltyRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id, period_month, period_year, total_revenue, payment_method, payment_reference, proof_url } = req.body;
    if (!school_id) {
      res.status(400).json({ error: 'school_id required' });
      return;
    }

    const month = period_month || (new Date().getMonth() + 1);
    const year = period_year || new Date().getFullYear();

    // Fetch royalty percentage
    const settingsRes = await pool.query(
      'SELECT royalty_percentage FROM franchise_settings WHERE school_id = $1', [school_id]
    );
    const royaltyPct = settingsRes.rows[0]?.royalty_percentage || 10;
    const royaltyAmount = Math.round((parseFloat(total_revenue || 0) * royaltyPct) / 100);

    const result = await pool.query(
      `INSERT INTO royalty_records (school_id, period_month, period_year, total_revenue, royalty_percentage, royalty_amount, status, payment_method, payment_reference, proof_url)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING_APPROVAL',$7,$8,$9)
       ON CONFLICT (school_id, period_month, period_year)
       DO UPDATE SET 
         total_revenue = EXCLUDED.total_revenue, 
         royalty_amount = EXCLUDED.royalty_amount,
         status = 'PENDING_APPROVAL',
         payment_method = EXCLUDED.payment_method,
         payment_reference = EXCLUDED.payment_reference,
         proof_url = EXCLUDED.proof_url
       RETURNING *`,
      [school_id, month, year, total_revenue || 0, royaltyPct, royaltyAmount, payment_method || 'Online Transfer', payment_reference || null, proof_url || null]
    );

    res.status(201).json({ message: 'Royalty record saved', data: result.rows[0] });
  } catch (error) {
    console.error('Create royalty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── MARK ROYALTY AS PAID / APPROVED / REJECTED ─────────────────────────────────────────────
export const markRoyaltyPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const { payment_reference, status } = req.body;

    if (!isSuperAdminUser(req)) {
      res.status(403).json({ error: 'Access denied. Only Super Admin can approve/verify royalty payments.' });
      return;
    }

    const newStatus = status || 'APPROVED';

    let result = await pool.query(
      `UPDATE royalty_records SET status = $1, payment_date = CURRENT_DATE, payment_reference = COALESCE($2, payment_reference) WHERE id::text = $3 RETURNING *`,
      [newStatus, payment_reference || null, id]
    );

    if (result.rows.length === 0 && id && typeof id === 'string' && id.startsWith('realtime-')) {
      const realSchoolId = id.replace('realtime-', '');
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const settingsRes = await pool.query(
        'SELECT royalty_percentage FROM franchise_settings WHERE school_id = $1', [realSchoolId]
      );
      const royaltyPct = settingsRes.rows[0]?.royalty_percentage || 10;

      const revRes = await pool.query(
        `SELECT COALESCE(SUM(p.amount_paid), 0) AS total_revenue
         FROM payments p
         JOIN student_fees sf ON p.student_fee_id = sf.id
         JOIN students st ON sf.student_id = st.id
         WHERE st.school_id = $1
           AND EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at)) = $2
           AND EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = $3`,
        [realSchoolId, currentMonth, currentYear]
      );
      const totalRev = parseFloat(revRes.rows[0].total_revenue || '0');
      const royaltyAmt = Math.round((totalRev * royaltyPct) / 100);

      result = await pool.query(
        `INSERT INTO royalty_records (school_id, period_month, period_year, total_revenue, royalty_percentage, royalty_amount, status, payment_date, payment_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,$8)
         ON CONFLICT (school_id, period_month, period_year)
         DO UPDATE SET status = EXCLUDED.status, payment_date = CURRENT_DATE, payment_reference = COALESCE(EXCLUDED.payment_reference, royalty_records.payment_reference)
         RETURNING *`,
        [realSchoolId, currentMonth, currentYear, totalRev, royaltyPct, royaltyAmt, newStatus, payment_reference || 'APPROVED_BY_ADMIN']
      );
    }

    if (result.rows.length === 0) { res.status(404).json({ error: 'Record not found' }); return; }
    res.status(200).json({ message: `Royalty marked as ${newStatus}`, data: result.rows[0] });
  } catch (error) {
    console.error('Mark royalty paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET FRANCHISE OVERVIEW STATS ─────────────────────────────────────────────
export const getFranchiseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuper = isSuperAdminUser(req);
    const userSchoolId = getTenantSchoolId(req);

    if (!isSuper && !userSchoolId) {
      res.status(200).json({
        data: {
          total_branches: 0,
          total_students: 0,
          total_teachers: 0,
          total_revenue: 0,
          pending_royalty: 0,
          collected_royalty: 0
        }
      });
      return;
    }

    let whereClause = '';
    const params: any[] = [];
    if (!isSuper && userSchoolId) {
      whereClause = 'WHERE s.id = $1';
      params.push(userSchoolId);
    }

    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT s.id) AS total_branches,
        (SELECT COUNT(*) FROM students st WHERE st.is_active = true AND ($1::uuid IS NULL OR st.school_id = $1)) AS total_students,
        (SELECT COUNT(*) FROM users u WHERE u.is_active = true AND u.role::text IN ('teacher', 'school_admin') AND ($1::uuid IS NULL OR u.school_id = $1 OR u.id IN (SELECT user_id FROM user_schools WHERE school_id = $1))) AS total_teachers,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM payments p JOIN student_fees sf ON p.student_fee_id = sf.id JOIN students st ON sf.student_id = st.id WHERE ($1::uuid IS NULL OR st.school_id = $1)) AS total_revenue,
        COALESCE(SUM(rr.royalty_amount) FILTER (WHERE LOWER(rr.status) IN ('pending', 'pending_approval')), 0) AS pending_royalty,
        COALESCE(SUM(rr.royalty_amount) FILTER (WHERE LOWER(rr.status) IN ('paid', 'approved')), 0) AS collected_royalty
      FROM schools s
      LEFT JOIN royalty_records rr ON rr.school_id = s.id
        AND rr.period_year = EXTRACT(YEAR FROM CURRENT_DATE)
      ${whereClause}
    `, [userSchoolId || null]);

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Get franchise stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GLOBAL PUSH (MOCK) ───────────────────────────────────────────────────────
export const globalPush = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, payload } = req.body;
    res.status(200).json({ 
      message: `Successfully pushed ${type} to all franchise branches.`, 
      data: payload 
    });
  } catch (error) {
    console.error('Global push error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET SUPPLY REQUESTS & DISPATCHES ─────────────────────────────────────────
export const getSupplyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuper = isSuperAdminUser(req);
    const userSchoolId = req.user?.school_id;

    let whereClause = '';
    const params: any[] = [];
    if (!isSuper && userSchoolId) {
      whereClause = 'WHERE sr.school_id = $1';
      params.push(userSchoolId);
    }

    const result = await pool.query(`
      SELECT sr.*, 
             TO_CHAR(sr.created_at, 'YYYY-MM-DD') AS date,
             TO_CHAR(sr.created_at, 'YYYY-MM-DD HH12:MI AM') AS formatted_time,
             sr.item_name AS item, sr.quantity AS qty, sr.branch_name AS branch
      FROM supply_requests sr
      ${whereClause}
      ORDER BY sr.created_at DESC
    `, params);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get supply requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE SUPPLY REQUEST ────────────────────────────────────────────────────
export const createSupplyRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id, branch_name, item_name, quantity, urgency, notes, size_breakdown, student_list, status, added_by } = req.body;

    const isSuper = isSuperAdminUser(req);
    const supplyStatus = status || (isSuper ? 'Delivered ✅' : 'DEMANDED BY BRANCH ⏳');
    const createdBy = added_by || (isSuper ? 'Admin' : (req.user?.role || 'Branch'));

    const result = await pool.query(`
      INSERT INTO supply_requests (school_id, branch_name, item_name, quantity, urgency, notes, size_breakdown, student_list, status, added_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *, 
                TO_CHAR(created_at, 'YYYY-MM-DD') AS date, 
                TO_CHAR(created_at, 'YYYY-MM-DD HH12:MI AM') AS formatted_time,
                item_name AS item, quantity AS qty, branch_name AS branch
    `, [
      school_id || req.user?.school_id || null,
      branch_name || 'Franchise Branch',
      item_name || 'School Supplies',
      quantity || 1,
      urgency || 'Normal',
      notes || null,
      JSON.stringify(size_breakdown || {}),
      JSON.stringify(student_list || []),
      supplyStatus,
      createdBy
    ]);

    const newRecord = result.rows[0];

    // If dispatched/delivered by admin, immediately adjust stock in real time
    if (supplyStatus.includes('Delivered') || supplyStatus.includes('Dispatched') || supplyStatus.includes('APPROVED')) {
      const itemQty = Number(quantity) || 1;
      const itemName = String(item_name || '').toLowerCase();
      const targetSchoolId = school_id || req.user?.school_id;

      if (size_breakdown?.uniforms) {
        for (const [sz, count] of Object.entries(size_breakdown.uniforms)) {
          const qty = Number(count) || 0;
          if (qty > 0) {
            await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE size_label = $2`, [qty, sz]);
            if (targetSchoolId) {
              await pool.query(
                `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
                 VALUES ($1, $2, 'UNIFORM', $3, $4)
                 ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $4`,
                [targetSchoolId, branch_name, sz, qty]
              );
            }
          }
        }
      }
      if (size_breakdown?.shoes) {
        for (const [sz, count] of Object.entries(size_breakdown.shoes)) {
          const qty = Number(count) || 0;
          if (qty > 0) {
            await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE size_label = $2`, [qty, sz]);
            if (targetSchoolId) {
              await pool.query(
                `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
                 VALUES ($1, $2, 'SHOES', $3, $4)
                 ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $4`,
                [targetSchoolId, branch_name, sz, qty]
              );
            }
          }
        }
      }
      if (!size_breakdown?.uniforms && !size_breakdown?.shoes) {
        if (itemName.includes('uniform') || itemName.includes('dress')) {
          await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE item_category = 'UNIFORM' AND size_label = 'Size 24 (Medium)'`, [itemQty]);
          if (targetSchoolId) {
            await pool.query(
              `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
               VALUES ($1, $2, 'UNIFORM', 'Size 24 (Medium)', $3)
               ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $3`,
              [targetSchoolId, branch_name, itemQty]
            );
          }
        } else if (itemName.includes('kit')) {
          await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE item_category = 'KITS'`, [itemQty]);
          if (targetSchoolId) {
            await pool.query(
              `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
               VALUES ($1, $2, 'KITS', 'Welcome Kit', $3)
               ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $3`,
              [targetSchoolId, branch_name, itemQty]
            );
          }
        } else if (itemName.includes('book') || itemName.includes('bag')) {
          await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE item_category = 'BOOKS'`, [itemQty]);
          if (targetSchoolId) {
            await pool.query(
              `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
               VALUES ($1, $2, 'BOOKS', 'Curriculum Book Set', $3)
               ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $3`,
              [targetSchoolId, branch_name, itemQty]
            );
          }
        }
      }
    }

    res.status(201).json({ message: 'Supply request submitted', data: newRecord });
  } catch (error) {
    console.error('Create supply request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET HEAD OFFICE INVENTORY ───────────────────────────────────────────────
export const getInventoryStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        hoi.id,
        COALESCE(hoi.item_name, hoi.size_label) AS item_name,
        hoi.item_category,
        hoi.size_label,
        hoi.total_stock,
        hoi.dispatched_stock,
        (hoi.total_stock - hoi.dispatched_stock) AS available_stock
      FROM head_office_inventory hoi
      ORDER BY hoi.item_category ASC, hoi.size_label ASC
    `);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── UPDATE SUPPLY REQUEST STATUS (DISPATCH & AUTOMATED STOCK DEDUCTION) ──────
export const updateSupplyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reqRecord = await pool.query(`SELECT * FROM supply_requests WHERE id = $1`, [id]);
    if (reqRecord.rows.length === 0) {
      res.status(404).json({ error: 'Supply request not found' });
      return;
    }

    const prevStatus = reqRecord.rows[0].status;
    const sizeBreakdown = reqRecord.rows[0].size_breakdown || {};
    const branchName = reqRecord.rows[0].branch_name || 'Chinchwad Branch';
    const itemQty = reqRecord.rows[0].quantity || 1;
    const itemName = reqRecord.rows[0].item_name || '';

    // Fetch school_id for branch
    const schoolRes = await pool.query(`SELECT id FROM schools WHERE name ILIKE $1 LIMIT 1`, [`%${branchName.replace(' Branch', '')}%`]);
    const branchSchoolId = schoolRes.rows[0]?.id;

    // Update status
    const result = await pool.query(`
      UPDATE supply_requests
      SET status = $1
      WHERE id = $2
      RETURNING *, TO_CHAR(created_at, 'YYYY-MM-DD') AS date, item_name AS item, quantity AS qty, branch_name AS branch
    `, [status || 'Dispatched ✅', id]);

    // If newly dispatched, deduct inventory stock per size
    if ((status.includes('Dispatched') || status.includes('APPROVED')) && !prevStatus.includes('Dispatched')) {
      // 1. Deduct uniform sizes
      if (sizeBreakdown.uniforms) {
        for (const [sz, count] of Object.entries(sizeBreakdown.uniforms)) {
          const qty = Number(count) || 0;
          if (qty > 0) {
            await pool.query(
              `UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE size_label = $2`,
              [qty, sz]
            );
          }
        }
      }
      // 2. Deduct shoe sizes
      if (sizeBreakdown.shoes) {
        for (const [sz, count] of Object.entries(sizeBreakdown.shoes)) {
          const qty = Number(count) || 0;
          if (qty > 0) {
            await pool.query(
              `UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE size_label = $2`,
              [qty, sz]
            );
          }
        }
      }
      // 3. Fallback: Deduct general category by item_name
      if (!sizeBreakdown.uniforms && !sizeBreakdown.shoes) {
        if (itemName.toLowerCase().includes('kit')) {
          await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE item_category = 'KITS'`, [itemQty]);
        } else if (itemName.toLowerCase().includes('book') || itemName.toLowerCase().includes('bag')) {
          await pool.query(`UPDATE head_office_inventory SET dispatched_stock = dispatched_stock + $1 WHERE item_category = 'BOOKS'`, [itemQty]);
        }
      }

      // 4. Increase stock quantity in destination Branch Inventory
      const branchSchoolId = reqRecord.rows[0].school_id;
      const branchName = reqRecord.rows[0].branch_name;
      if (branchSchoolId) {
        if (sizeBreakdown.uniforms) {
          for (const [sz, count] of Object.entries(sizeBreakdown.uniforms)) {
            const qty = Number(count) || 0;
            if (qty > 0) {
              await pool.query(
                `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
                 VALUES ($1, $2, 'UNIFORM', $3, $4)
                 ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $4`,
                [branchSchoolId, branchName, sz, qty]
              );
            }
          }
        }
        if (sizeBreakdown.shoes) {
          for (const [sz, count] of Object.entries(sizeBreakdown.shoes)) {
            const qty = Number(count) || 0;
            if (qty > 0) {
              await pool.query(
                `INSERT INTO branch_inventory (school_id, branch_name, item_category, size_label, stock_quantity)
                 VALUES ($1, $2, 'SHOES', $3, $4)
                 ON CONFLICT (school_id, size_label) DO UPDATE SET stock_quantity = branch_inventory.stock_quantity + $4`,
                [branchSchoolId, branchName, sz, qty]
              );
            }
          }
        }
      }
    }

    res.status(200).json({ message: `Supply request updated to ${status} and stock deducted from Head Office Inventory!`, data: result.rows[0] });
  } catch (error) {
    console.error('Update supply status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET BRANCH INVENTORY STOCK (SUPER ADMIN & BRANCH VIEW) ───────────────────
export const getBranchInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuper = isSuperAdminUser(req);
    const userSchoolId = req.user?.school_id;

    let whereClause = '';
    const params: any[] = [];
    if (!isSuper && userSchoolId) {
      whereClause = 'WHERE bi.school_id = $1';
      params.push(userSchoolId);
    }

    const result = await pool.query(`
      SELECT bi.*, s.name AS school_name
      FROM branch_inventory bi
      JOIN schools s ON s.id = bi.school_id
      ${whereClause}
      ORDER BY s.name ASC, bi.item_category ASC, bi.size_label ASC
    `, params);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get branch inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET FRANCHISE REVENUE HISTORY ───────────────────────────────────────────
export const getFranchiseRevenueHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id, year } = req.query;
    const targetYear = year ? parseInt(String(year)) : new Date().getFullYear();

    const query = `
      SELECT 
        s.id AS school_id,
        s.name AS school_name,
        s.city,
        m.month_num AS period_month,
        TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Month') AS month_name,
        $1::integer AS period_year,
        COALESCE(rev.total_revenue, 0) AS total_revenue,
        COALESCE(fs.royalty_percentage, 10) AS royalty_percentage,
        ROUND((COALESCE(rev.total_revenue, 0) * COALESCE(fs.royalty_percentage, 10)) / 100) AS royalty_amount,
        COALESCE(rr.status, CASE WHEN COALESCE(rev.total_revenue, 0) > 0 THEN 'PENDING' ELSE 'NIL' END) AS status,
        COALESCE(rr.payment_method, 'Online / NEFT') AS payment_method,
        COALESCE(rr.payment_reference, '-') AS payment_reference,
        rr.proof_url
      FROM schools s
      CROSS JOIN (SELECT generate_series(1, 12) AS month_num) m
      LEFT JOIN franchise_settings fs ON fs.school_id = s.id
      LEFT JOIN (
        SELECT 
          COALESCE(st.school_id, (SELECT id FROM schools WHERE name LIKE '%Chinchwad%' LIMIT 1)) AS school_id,
          EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at))::integer AS p_month,
          SUM(p.amount_paid) AS total_revenue
        FROM payments p
        JOIN student_fees sf ON p.student_fee_id = sf.id
        JOIN students st ON sf.student_id = st.id
        WHERE EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = $1
        GROUP BY 1, 2
      ) rev ON rev.school_id = s.id AND rev.p_month = m.month_num
      LEFT JOIN royalty_records rr ON rr.school_id = s.id AND rr.period_month = m.month_num AND rr.period_year = $1
      WHERE ($2::uuid IS NULL OR s.id = $2)
      ORDER BY s.name ASC, m.month_num DESC
    `;

    const result = await pool.query(query, [targetYear, school_id || null]);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get franchise revenue history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


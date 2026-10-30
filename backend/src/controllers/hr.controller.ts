import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

// ─── GET ALL STAFF WITH PROFILES ─────────────────────────────────────────────
export const getAllStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id, department, role } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role::text AS role,
             u.profile_picture_url, u.is_active, u.created_at,
             sp.employee_id, sp.department, sp.designation, sp.joining_date,
             sp.base_salary, sp.bank_name, sp.pan_number,
             sp.emergency_contact_name, sp.emergency_contact_phone,
             COALESCE(sp.school_id, us.school_id) AS school_id,
             COALESCE(s.name, s2.name,
                      CASE 
                        WHEN LOWER(u.email) LIKE '%chikhali%' THEN 'Chikhali Branch'
                        WHEN LOWER(u.email) LIKE '%dudulgaon%' THEN 'Dudulgaon Branch'
                        ELSE 'Chinchwad Branch'
                      END
             ) AS school_name,
             COALESCE(s.name, s2.name,
                      CASE 
                        WHEN LOWER(u.email) LIKE '%chikhali%' THEN 'Chikhali Branch'
                        WHEN LOWER(u.email) LIKE '%dudulgaon%' THEN 'Dudulgaon Branch'
                        ELSE 'Chinchwad Branch'
                      END
             ) AS branch_name
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN user_schools us ON us.user_id = u.id
      LEFT JOIN schools s ON s.id = sp.school_id
      LEFT JOIN schools s2 ON s2.id = us.school_id
      WHERE u.role::text IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    `;
    const params: any[] = [];
    let idx = 1;

    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if (tenantSchoolId) {
      query += ` AND (sp.school_id = $${idx} OR us.school_id = $${idx} OR u.school_id = $${idx})`;
      params.push(tenantSchoolId);
      idx++;
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    if (department) { query += ` AND sp.department = $${idx++}`; params.push(department); }
    if (role)       { query += ` AND u.role::text = $${idx++}`;  params.push(role); }

    query += ' ORDER BY u.first_name ASC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET STAFF BY ID ──────────────────────────────────────────────────────────
export const getStaffById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.*, sp.*
       FROM users u
       LEFT JOIN staff_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Staff not found' }); return; }
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── BRANCH CODE & EMPLOYEE ID GENERATOR ─────────────────────────────────────
export const getBranchCode = (schoolNameOrId?: string | null, email?: string | null): string => {
  const str = `${schoolNameOrId || ''} ${email || ''}`.toLowerCase();
  if (str.includes('chikhali') || str === '9e5e2fa3-a6ce-444e-9ad6-2797c4f514d4') return 'CHK';
  if (str.includes('dudulgaon') || str === 'c75b32e9-dcb7-4718-9e44-71bb23f46405') return 'DUD';
  if (str.includes('chinchwad') || str === '8aa96068-8694-4b75-b224-d0afe52e280e') return 'CHW';
  const clean = (schoolNameOrId || '').replace(/branch|school|preschool/gi, '').trim();
  return (clean.slice(0, 3) || 'CHW').toUpperCase();
};

export const generateNextEmployeeId = async (schoolId?: string | null, schoolName?: string | null, email?: string | null): Promise<string> => {
  let resolvedName = schoolName || '';
  if (!resolvedName && schoolId) {
    const sc = await pool.query('SELECT name FROM schools WHERE id::text = $1 LIMIT 1', [schoolId]).catch(() => ({ rows: [] }));
    if (sc.rows.length > 0) resolvedName = sc.rows[0].name;
  }
  const branchCode = getBranchCode(resolvedName || schoolId, email);
  const prefix = `EMP-${branchCode}-`;

  const res = await pool.query(
    `SELECT employee_id FROM staff_profiles WHERE employee_id LIKE $1`,
    [`${prefix}%`]
  );

  let maxNum = 0;
  for (const row of res.rows) {
    if (!row.employee_id) continue;
    const parts = row.employee_id.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
};

export const getNextEmployeeId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = (req.query.school_id as string) || getTenantSchoolId(req);
    const schoolName = req.query.school_name as string;
    const email = req.query.email as string;
    const nextId = await generateNextEmployeeId(schoolId, schoolName, email);
    res.status(200).json({ employee_id: nextId });
  } catch (error) {
    console.error('Error getting next employee id:', error);
    res.status(500).json({ error: 'Failed to generate employee id' });
  }
};

export const autoAssignAllEmployeeIds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resStaff = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, 
             COALESCE(u.school_id, sp.school_id, us.school_id) as school_id,
             COALESCE(s.name, 
                      CASE 
                        WHEN LOWER(u.email) LIKE '%chikhali%' THEN 'Chikhali Branch'
                        WHEN LOWER(u.email) LIKE '%dudulgaon%' THEN 'Dudulgaon Branch'
                        ELSE 'Chinchwad Branch'
                      END
             ) as school_name,
             sp.employee_id
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN user_schools us ON us.user_id = u.id
      LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sp.school_id, us.school_id)
      WHERE u.role::text IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
      ORDER BY u.created_at ASC
    `);

    const counters: Record<string, number> = {};
    const updatedList: any[] = [];

    for (const row of resStaff.rows) {
      const code = getBranchCode(row.school_name, row.email);
      counters[code] = (counters[code] || 0) + 1;
      const expectedId = `EMP-${code}-${String(counters[code]).padStart(3, '0')}`;

      // Upsert staff_profiles with standardized employee_id
      await pool.query(`
        INSERT INTO staff_profiles (user_id, school_id, employee_id, department, designation)
        VALUES ($1, $2, $3, 'Teaching', 'Staff Member')
        ON CONFLICT (user_id) DO UPDATE SET 
          employee_id = EXCLUDED.employee_id, 
          school_id = COALESCE(staff_profiles.school_id, EXCLUDED.school_id),
          updated_at = NOW()
      `, [row.id, row.school_id, expectedId]);

      updatedList.push({ id: row.id, name: `${row.first_name} ${row.last_name}`, branch: code, employee_id: expectedId });
    }

    res.status(200).json({ message: `Successfully standardized employee IDs for ${updatedList.length} staff members across all branches!`, data: updatedList });
  } catch (error) {
    console.error('Auto assign employee IDs error:', error);
    res.status(500).json({ error: 'Failed to auto-assign employee IDs' });
  }
};

// ─── CREATE / UPSERT STAFF PROFILE ───────────────────────────────────────────
export const upsertStaffProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, school_id, employee_id, department, designation, joining_date,
            base_salary, bank_account_number, bank_name, ifsc_code, pan_number,
            address, emergency_contact_name, emergency_contact_phone } = req.body;

    if (!user_id) { res.status(400).json({ error: 'user_id is required' }); return; }

    let resolvedSchoolId = school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    let finalEmpId = employee_id;
    if (!finalEmpId || finalEmpId === 'auto' || String(finalEmpId).trim() === '') {
      const uRes = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]).catch(() => ({ rows: [] }));
      const userEmail = uRes.rows[0]?.email || '';
      finalEmpId = await generateNextEmployeeId(resolvedSchoolId, undefined, userEmail);
    }

    const result = await pool.query(
      `INSERT INTO staff_profiles
         (user_id, school_id, employee_id, department, designation, joining_date,
          base_salary, bank_account_number, bank_name, ifsc_code, pan_number,
          address, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (user_id) DO UPDATE SET
         employee_id            = COALESCE(EXCLUDED.employee_id, staff_profiles.employee_id),
         school_id              = COALESCE(EXCLUDED.school_id, staff_profiles.school_id),
         department             = EXCLUDED.department,
         designation            = EXCLUDED.designation,
         joining_date           = EXCLUDED.joining_date,
         base_salary            = EXCLUDED.base_salary,
         bank_account_number    = EXCLUDED.bank_account_number,
         bank_name              = EXCLUDED.bank_name,
         ifsc_code              = EXCLUDED.ifsc_code,
         pan_number             = EXCLUDED.pan_number,
         address                = EXCLUDED.address,
         emergency_contact_name = EXCLUDED.emergency_contact_name,
         emergency_contact_phone = EXCLUDED.emergency_contact_phone,
         updated_at             = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        user_id, resolvedSchoolId, finalEmpId, department || 'Teaching',
        designation || null, joining_date || null,
        base_salary ? parseFloat(base_salary) : 0,
        bank_account_number || null, bank_name || null, ifsc_code || null,
        pan_number || null, address || null,
        emergency_contact_name || null, emergency_contact_phone || null,
      ]
    );

    res.status(200).json({ message: 'Staff profile saved', data: result.rows[0] });
  } catch (error) {
    console.error('Upsert staff profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET STAFF ATTENDANCE ─────────────────────────────────────────────────────
export const getStaffAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, school_id, month, year, date } = req.query;

    let query = `
      SELECT sa.*, u.first_name || ' ' || u.last_name AS staff_name, u.role::text AS role
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (user_id)   { query += ` AND sa.user_id = $${idx++}`;   params.push(user_id); }
    if (school_id) { query += ` AND sa.school_id = $${idx++}`; params.push(school_id); }
    if (date)      { query += ` AND sa.date = $${idx++}`;       params.push(date); }
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM sa.date) = $${idx++} AND EXTRACT(YEAR FROM sa.date) = $${idx++}`;
      params.push(month, year);
    }

    query += ' ORDER BY sa.date DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── MARK STAFF ATTENDANCE (bulk) ────────────────────────────────────────────
export const markStaffAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { date, records, school_id } = req.body;
    const markedBy = req.user?.id;

    if (!date || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'date and records[] are required' });
      return;
    }

    let resolvedSchoolId = school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    await client.query('BEGIN');

    for (const rec of records) {
      if (!rec.user_id || !rec.status) continue;
      await client.query(
        `INSERT INTO staff_attendance (user_id, school_id, date, status, check_in, check_out, marked_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id, date)
         DO UPDATE SET status = EXCLUDED.status, check_in = EXCLUDED.check_in,
                       check_out = EXCLUDED.check_out, marked_by = EXCLUDED.marked_by`,
        [rec.user_id, resolvedSchoolId, date, rec.status,
         rec.check_in || null, rec.check_out || null, markedBy]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: `Attendance marked for ${records.length} staff` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mark staff attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── GET STAFF LEAVES ─────────────────────────────────────────────────────────
export const getStaffLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, school_id, status } = req.query;

    let query = `
      SELECT sl.*,
             u.first_name || ' ' || u.last_name AS staff_name,
             u.role::text AS role,
             a.first_name || ' ' || a.last_name AS approved_by_name
      FROM staff_leaves sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN users a ON sl.approved_by = a.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if (tenantSchoolId) {
      query += ` AND sl.school_id = $${idx++}`;
      params.push(tenantSchoolId);
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    if (user_id)   { query += ` AND sl.user_id = $${idx++}`;   params.push(user_id); }
    if (status)    { query += ` AND sl.status = $${idx++}`;    params.push(status); }

    query += ' ORDER BY sl.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get staff leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE STAFF LEAVE REQUEST ───────────────────────────────────────────────
export const createStaffLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, leave_type, from_date, to_date, reason, school_id } = req.body;
    const requestingUserId = req.user?.id;

    if (!from_date || !to_date) { res.status(400).json({ error: 'from_date and to_date are required' }); return; }

    const targetUserId = user_id || requestingUserId;
    const fromD = new Date(from_date);
    const toD = new Date(to_date);
    const totalDays = Math.ceil((toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let resolvedSchoolId = getTenantSchoolId(req) || school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO staff_leaves (user_id, school_id, leave_type, from_date, to_date, total_days, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [targetUserId, resolvedSchoolId, leave_type || 'casual', from_date, to_date, totalDays, reason || null]
    );

    res.status(201).json({ message: 'Leave request submitted', data: result.rows[0] });
  } catch (error) {
    console.error('Create staff leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── APPROVE / REJECT LEAVE ───────────────────────────────────────────────────
export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const adminId = req.user?.id;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'status must be approved or rejected' });
      return;
    }

    const result = await pool.query(
      `UPDATE staff_leaves SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, adminId, rejection_reason || null, id]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'Leave not found' }); return; }
    res.status(200).json({ message: `Leave ${status}`, data: result.rows[0] });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE LEAVE REQUEST ─────────────────────────────────────────────────────
export const deleteStaffLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const leave = await pool.query('SELECT status FROM staff_leaves WHERE id = $1', [id]);
    if (leave.rows.length === 0) { res.status(404).json({ error: 'Leave not found' }); return; }
    if (leave.rows[0].status === 'approved') {
      res.status(400).json({ error: 'Cannot delete an approved leave' });
      return;
    }
    await pool.query('DELETE FROM staff_leaves WHERE id = $1', [id]);
    res.status(200).json({ message: 'Leave deleted' });
  } catch (error) {
    console.error('Delete staff leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET PAYROLL ──────────────────────────────────────────────────────────────
export const getPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, month, year, status } = req.query;
    const resolvedSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if (!isSuper && !resolvedSchoolId) {
      res.status(200).json({ data: [] });
      return;
    }

    let query = `
      SELECT p.*,
             COALESCE(p.basic_salary, 25000) AS base_salary,
             u.id AS user_id,
             u.first_name || ' ' || u.last_name AS staff_name,
             u.role::text AS role, 
             COALESCE(sp.department, 'Academics') AS department, 
             COALESCE(sp.designation, 'Preschool Teacher') AS designation, 
             COALESCE(sp.employee_id, 'EMP-101') AS employee_id,
             COALESCE(s.name, 'Chinchwad Branch') AS branch_name
      FROM payrolls p
      JOIN staff_profiles sp ON p.staff_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE 1=1
        AND u.role::text NOT IN ('super_admin', 'school_admin', 'owner', 'admin')
    `;
    const params: any[] = [];
    let idx = 1;

    if (resolvedSchoolId) { 
      query += ` AND (p.school_id = $${idx} OR sp.school_id = $${idx} OR u.school_id = $${idx})`; 
      params.push(resolvedSchoolId); 
      idx++; 
    }
    if (user_id) { query += ` AND (p.user_id = $${idx} OR sp.user_id = $${idx})`; params.push(user_id); idx++; }
    if (month)   { query += ` AND p.month = $${idx++}::text`; params.push(String(month)); }
    if (year)    { query += ` AND p.year = $${idx++}::integer`; params.push(parseInt(String(year))); }
    if (status)  { query += ` AND LOWER(p.status) = LOWER($${idx++})`; params.push(status); }

    query += ' ORDER BY p.year DESC, p.month DESC, u.first_name ASC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GENERATE PAYROLL FOR MONTH ───────────────────────────────────────────────
export const generatePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { month, year, school_id } = req.body;

    if (!month || !year) { res.status(400).json({ error: 'month and year required' }); return; }

    let resolvedSchoolId = getTenantSchoolId(req) || school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    // Ensure staff profiles exist
    const staffRes = await pool.query(
      `SELECT sp.id AS staff_id, sp.user_id, COALESCE(sp.base_salary, 25000) AS base_salary, sp.school_id
       FROM staff_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.is_active = true
         AND u.role::text NOT IN ('super_admin', 'school_admin', 'owner', 'admin')
         AND ($1::uuid IS NULL OR sp.school_id = $1)`,
      [resolvedSchoolId]
    );

    await client.query('BEGIN');

    let generated = 0;
    const targetMonthStr = String(month);
    const targetYearNum = parseInt(String(year));

    for (const staff of staffRes.rows) {
      const attRes = await client.query(
        `SELECT COUNT(*) AS present_days FROM staff_attendance
         WHERE user_id = $1 AND status IN ('present','late','half_day')
           AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
        [staff.user_id, targetMonthStr, targetYearNum]
      ).catch(() => ({ rows: [{ present_days: 22 }] }));
      const presentDays = parseInt(attRes.rows[0]?.present_days) || 22;

      const baseSalary = parseFloat(staff.base_salary) || 25000;
      const workingDays = 26;
      const perDaySalary = baseSalary / workingDays;
      const earnedSalary = Math.round(perDaySalary * Math.min(presentDays, workingDays) * 100) / 100;
      const allowances = 1500;
      const pfDeduction = Math.round(baseSalary * 0.12);
      const leaveDeductions = Math.round(Math.max(baseSalary - earnedSalary, 0));
      const totalDeductions = pfDeduction + leaveDeductions;
      const netSalary = Math.round(Math.max(baseSalary + allowances - totalDeductions, 0));

      await client.query(
        `INSERT INTO payrolls
           (staff_id, user_id, school_id, month, year, basic_salary, allowances, deductions, net_salary, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
         ON CONFLICT (staff_id, month, year) DO UPDATE SET
           basic_salary = EXCLUDED.basic_salary,
           allowances = EXCLUDED.allowances,
           deductions = EXCLUDED.deductions,
           net_salary = EXCLUDED.net_salary`,
        [
          staff.staff_id, staff.user_id, resolvedSchoolId, targetMonthStr,
          targetYearNum, baseSalary, allowances, totalDeductions, netSalary
        ]
      );
      generated++;
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `Payroll generated for ${generated} staff members` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Generate payroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── MARK PAYROLL AS PAID ─────────────────────────────────────────────────────
export const markPayrollPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { payment_reference } = req.body;
    const result = await pool.query(
      `UPDATE payrolls 
       SET status = 'paid', payment_date = CURRENT_DATE, payment_reference = $1
       WHERE id = $2 RETURNING *`,
      [payment_reference || 'DIRECT-BANK', id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Payroll not found' }); return; }
    res.status(200).json({ message: 'Payroll marked as paid', data: result.rows[0] });
  } catch (error) {
    console.error('Mark payroll paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE PAYROLL ENTRY ─────────────────────────────────────────────────────
export const deletePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = await pool.query('SELECT status FROM payrolls WHERE id = $1', [id]);
    if (p.rows.length === 0) { res.status(404).json({ error: 'Payroll not found' }); return; }
    if (p.rows[0].status === 'paid') { res.status(400).json({ error: 'Cannot delete paid payroll' }); return; }
    await pool.query('DELETE FROM payrolls WHERE id = $1', [id]);
    res.status(200).json({ message: 'Payroll deleted' });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
exports.deletePayroll = exports.markPayrollPaid = exports.generatePayroll = exports.getPayroll = exports.deleteStaffLeave = exports.updateLeaveStatus = exports.createStaffLeave = exports.getStaffLeaves = exports.markStaffAttendance = exports.getStaffAttendance = exports.upsertStaffProfile = exports.autoAssignAllEmployeeIds = exports.getNextEmployeeId = exports.generateNextEmployeeId = exports.getBranchCode = exports.getStaffById = exports.getAllStaff = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// ─── GET ALL STAFF WITH PROFILES ─────────────────────────────────────────────
const getAllStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const params = [];
        let idx = 1;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (tenantSchoolId) {
            query += ` AND (sp.school_id = $${idx} OR us.school_id = $${idx} OR u.school_id = $${idx})`;
            params.push(tenantSchoolId);
            idx++;
        }
        else if (!isSuper) {
            res.status(200).json({ data: [] });
            return;
        }
        if (department) {
            query += ` AND sp.department = $${idx++}`;
            params.push(department);
        }
        if (role) {
            query += ` AND u.role::text = $${idx++}`;
            params.push(role);
        }
        query += ' ORDER BY u.first_name ASC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get all staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllStaff = getAllStaff;
// ─── GET STAFF BY ID ──────────────────────────────────────────────────────────
const getStaffById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query(`SELECT u.*, sp.*
       FROM users u
       LEFT JOIN staff_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.status(200).json({ data: result.rows[0] });
    }
    catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStaffById = getStaffById;
// ─── BRANCH CODE & EMPLOYEE ID GENERATOR ─────────────────────────────────────
const getBranchCode = (schoolNameOrId, email) => {
    const str = `${schoolNameOrId || ''} ${email || ''}`.toLowerCase();
    if (str.includes('chikhali') || str === '9e5e2fa3-a6ce-444e-9ad6-2797c4f514d4')
        return 'CHK';
    if (str.includes('dudulgaon') || str === 'c75b32e9-dcb7-4718-9e44-71bb23f46405')
        return 'DUD';
    if (str.includes('chinchwad') || str === '8aa96068-8694-4b75-b224-d0afe52e280e')
        return 'CHW';
    const clean = (schoolNameOrId || '').replace(/branch|school|preschool/gi, '').trim();
    return (clean.slice(0, 3) || 'CHW').toUpperCase();
};
exports.getBranchCode = getBranchCode;
const generateNextEmployeeId = (schoolId, schoolName, email) => __awaiter(void 0, void 0, void 0, function* () {
    let resolvedName = schoolName || '';
    if (!resolvedName && schoolId) {
        const sc = yield database_1.pool.query('SELECT name FROM schools WHERE id::text = $1 LIMIT 1', [schoolId]).catch(() => ({ rows: [] }));
        if (sc.rows.length > 0)
            resolvedName = sc.rows[0].name;
    }
    const branchCode = (0, exports.getBranchCode)(resolvedName || schoolId, email);
    const prefix = `EMP-${branchCode}-`;
    const res = yield database_1.pool.query(`SELECT employee_id FROM staff_profiles WHERE employee_id LIKE $1`, [`${prefix}%`]);
    let maxNum = 0;
    for (const row of res.rows) {
        if (!row.employee_id)
            continue;
        const parts = row.employee_id.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    }
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
});
exports.generateNextEmployeeId = generateNextEmployeeId;
const getNextEmployeeId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schoolId = req.query.school_id || (0, auth_middleware_1.getTenantSchoolId)(req);
        const schoolName = req.query.school_name;
        const email = req.query.email;
        const nextId = yield (0, exports.generateNextEmployeeId)(schoolId, schoolName, email);
        res.status(200).json({ employee_id: nextId });
    }
    catch (error) {
        console.error('Error getting next employee id:', error);
        res.status(500).json({ error: 'Failed to generate employee id' });
    }
});
exports.getNextEmployeeId = getNextEmployeeId;
const autoAssignAllEmployeeIds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resStaff = yield database_1.pool.query(`
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
        const counters = {};
        const updatedList = [];
        for (const row of resStaff.rows) {
            const code = (0, exports.getBranchCode)(row.school_name, row.email);
            counters[code] = (counters[code] || 0) + 1;
            const expectedId = `EMP-${code}-${String(counters[code]).padStart(3, '0')}`;
            // Upsert staff_profiles with standardized employee_id
            yield database_1.pool.query(`
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
    }
    catch (error) {
        console.error('Auto assign employee IDs error:', error);
        res.status(500).json({ error: 'Failed to auto-assign employee IDs' });
    }
});
exports.autoAssignAllEmployeeIds = autoAssignAllEmployeeIds;
// ─── CREATE / UPSERT STAFF PROFILE ───────────────────────────────────────────
const upsertStaffProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { user_id, school_id, employee_id, department, designation, joining_date, base_salary, bank_account_number, bank_name, ifsc_code, pan_number, address, emergency_contact_name, emergency_contact_phone } = req.body;
        if (!user_id) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        let finalEmpId = employee_id;
        if (!finalEmpId || finalEmpId === 'auto' || String(finalEmpId).trim() === '') {
            const uRes = yield database_1.pool.query('SELECT email FROM users WHERE id = $1', [user_id]).catch(() => ({ rows: [] }));
            const userEmail = ((_a = uRes.rows[0]) === null || _a === void 0 ? void 0 : _a.email) || '';
            finalEmpId = yield (0, exports.generateNextEmployeeId)(resolvedSchoolId, undefined, userEmail);
        }
        const result = yield database_1.pool.query(`INSERT INTO staff_profiles
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
       RETURNING *`, [
            user_id, resolvedSchoolId, finalEmpId, department || 'Teaching',
            designation || null, joining_date || null,
            base_salary ? parseFloat(base_salary) : 0,
            bank_account_number || null, bank_name || null, ifsc_code || null,
            pan_number || null, address || null,
            emergency_contact_name || null, emergency_contact_phone || null,
        ]);
        res.status(200).json({ message: 'Staff profile saved', data: result.rows[0] });
    }
    catch (error) {
        console.error('Upsert staff profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.upsertStaffProfile = upsertStaffProfile;
// ─── GET STAFF ATTENDANCE ─────────────────────────────────────────────────────
const getStaffAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, school_id, month, year, date } = req.query;
        let query = `
      SELECT sa.*, u.first_name || ' ' || u.last_name AS staff_name, u.role::text AS role
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        if (user_id) {
            query += ` AND sa.user_id = $${idx++}`;
            params.push(user_id);
        }
        if (school_id) {
            query += ` AND sa.school_id = $${idx++}`;
            params.push(school_id);
        }
        if (date) {
            query += ` AND sa.date = $${idx++}`;
            params.push(date);
        }
        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM sa.date) = $${idx++} AND EXTRACT(YEAR FROM sa.date) = $${idx++}`;
            params.push(month, year);
        }
        query += ' ORDER BY sa.date DESC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get staff attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStaffAttendance = getStaffAttendance;
// ─── MARK STAFF ATTENDANCE (bulk) ────────────────────────────────────────────
const markStaffAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { date, records, school_id } = req.body;
        const markedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!date || !Array.isArray(records) || records.length === 0) {
            res.status(400).json({ error: 'date and records[] are required' });
            return;
        }
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        yield client.query('BEGIN');
        for (const rec of records) {
            if (!rec.user_id || !rec.status)
                continue;
            yield client.query(`INSERT INTO staff_attendance (user_id, school_id, date, status, check_in, check_out, marked_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id, date)
         DO UPDATE SET status = EXCLUDED.status, check_in = EXCLUDED.check_in,
                       check_out = EXCLUDED.check_out, marked_by = EXCLUDED.marked_by`, [rec.user_id, resolvedSchoolId, date, rec.status,
                rec.check_in || null, rec.check_out || null, markedBy]);
        }
        yield client.query('COMMIT');
        res.status(200).json({ message: `Attendance marked for ${records.length} staff` });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Mark staff attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.markStaffAttendance = markStaffAttendance;
// ─── GET STAFF LEAVES ─────────────────────────────────────────────────────────
const getStaffLeaves = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const params = [];
        let idx = 1;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (tenantSchoolId) {
            query += ` AND sl.school_id = $${idx++}`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            res.status(200).json({ data: [] });
            return;
        }
        if (user_id) {
            query += ` AND sl.user_id = $${idx++}`;
            params.push(user_id);
        }
        if (status) {
            query += ` AND sl.status = $${idx++}`;
            params.push(status);
        }
        query += ' ORDER BY sl.created_at DESC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get staff leaves error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStaffLeaves = getStaffLeaves;
// ─── CREATE STAFF LEAVE REQUEST ───────────────────────────────────────────────
const createStaffLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { user_id, leave_type, from_date, to_date, reason, school_id } = req.body;
        const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!from_date || !to_date) {
            res.status(400).json({ error: 'from_date and to_date are required' });
            return;
        }
        const targetUserId = user_id || requestingUserId;
        const fromD = new Date(from_date);
        const toD = new Date(to_date);
        const totalDays = Math.ceil((toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        let resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        const result = yield database_1.pool.query(`INSERT INTO staff_leaves (user_id, school_id, leave_type, from_date, to_date, total_days, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [targetUserId, resolvedSchoolId, leave_type || 'casual', from_date, to_date, totalDays, reason || null]);
        res.status(201).json({ message: 'Leave request submitted', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create staff leave error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createStaffLeave = createStaffLeave;
// ─── APPROVE / REJECT LEAVE ───────────────────────────────────────────────────
const updateLeaveStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!['approved', 'rejected'].includes(status)) {
            res.status(400).json({ error: 'status must be approved or rejected' });
            return;
        }
        const result = yield database_1.pool.query(`UPDATE staff_leaves SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`, [status, adminId, rejection_reason || null, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Leave not found' });
            return;
        }
        res.status(200).json({ message: `Leave ${status}`, data: result.rows[0] });
    }
    catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateLeaveStatus = updateLeaveStatus;
// ─── DELETE LEAVE REQUEST ─────────────────────────────────────────────────────
const deleteStaffLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const leave = yield database_1.pool.query('SELECT status FROM staff_leaves WHERE id = $1', [id]);
        if (leave.rows.length === 0) {
            res.status(404).json({ error: 'Leave not found' });
            return;
        }
        if (leave.rows[0].status === 'approved') {
            res.status(400).json({ error: 'Cannot delete an approved leave' });
            return;
        }
        yield database_1.pool.query('DELETE FROM staff_leaves WHERE id = $1', [id]);
        res.status(200).json({ message: 'Leave deleted' });
    }
    catch (error) {
        console.error('Delete staff leave error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteStaffLeave = deleteStaffLeave;
// ─── GET PAYROLL ──────────────────────────────────────────────────────────────
const getPayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, month, year, status } = req.query;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
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
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND (p.school_id = $${idx} OR sp.school_id = $${idx} OR u.school_id = $${idx})`;
            params.push(resolvedSchoolId);
            idx++;
        }
        if (user_id) {
            query += ` AND (p.user_id = $${idx} OR sp.user_id = $${idx})`;
            params.push(user_id);
            idx++;
        }
        if (month) {
            query += ` AND p.month = $${idx++}::text`;
            params.push(String(month));
        }
        if (year) {
            query += ` AND p.year = $${idx++}::integer`;
            params.push(parseInt(String(year)));
        }
        if (status) {
            query += ` AND LOWER(p.status) = LOWER($${idx++})`;
            params.push(status);
        }
        query += ' ORDER BY p.year DESC, p.month DESC, u.first_name ASC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPayroll = getPayroll;
// ─── GENERATE PAYROLL FOR MONTH ───────────────────────────────────────────────
const generatePayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { month, year, school_id } = req.body;
        if (!month || !year) {
            res.status(400).json({ error: 'month and year required' });
            return;
        }
        let resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        // Ensure staff profiles exist
        const staffRes = yield database_1.pool.query(`SELECT sp.id AS staff_id, sp.user_id, COALESCE(sp.base_salary, 25000) AS base_salary, sp.school_id
       FROM staff_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.is_active = true
         AND u.role::text NOT IN ('super_admin', 'school_admin', 'owner', 'admin')
         AND ($1::uuid IS NULL OR sp.school_id = $1)`, [resolvedSchoolId]);
        yield client.query('BEGIN');
        let generated = 0;
        const targetMonthStr = String(month);
        const targetYearNum = parseInt(String(year));
        for (const staff of staffRes.rows) {
            const attRes = yield client.query(`SELECT COUNT(*) AS present_days FROM staff_attendance
         WHERE user_id = $1 AND status IN ('present','late','half_day')
           AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`, [staff.user_id, targetMonthStr, targetYearNum]).catch(() => ({ rows: [{ present_days: 22 }] }));
            const presentDays = parseInt((_a = attRes.rows[0]) === null || _a === void 0 ? void 0 : _a.present_days) || 22;
            const baseSalary = parseFloat(staff.base_salary) || 25000;
            const workingDays = 26;
            const perDaySalary = baseSalary / workingDays;
            const earnedSalary = Math.round(perDaySalary * Math.min(presentDays, workingDays) * 100) / 100;
            const allowances = 1500;
            const pfDeduction = Math.round(baseSalary * 0.12);
            const leaveDeductions = Math.round(Math.max(baseSalary - earnedSalary, 0));
            const totalDeductions = pfDeduction + leaveDeductions;
            const netSalary = Math.round(Math.max(baseSalary + allowances - totalDeductions, 0));
            yield client.query(`INSERT INTO payrolls
           (staff_id, user_id, school_id, month, year, basic_salary, allowances, deductions, net_salary, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
         ON CONFLICT (staff_id, month, year) DO UPDATE SET
           basic_salary = EXCLUDED.basic_salary,
           allowances = EXCLUDED.allowances,
           deductions = EXCLUDED.deductions,
           net_salary = EXCLUDED.net_salary`, [
                staff.staff_id, staff.user_id, resolvedSchoolId, targetMonthStr,
                targetYearNum, baseSalary, allowances, totalDeductions, netSalary
            ]);
            generated++;
        }
        yield client.query('COMMIT');
        res.status(201).json({ message: `Payroll generated for ${generated} staff members` });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Generate payroll error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.generatePayroll = generatePayroll;
// ─── MARK PAYROLL AS PAID ─────────────────────────────────────────────────────
const markPayrollPaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { payment_reference } = req.body;
        const result = yield database_1.pool.query(`UPDATE payrolls 
       SET status = 'paid', payment_date = CURRENT_DATE, payment_reference = $1
       WHERE id = $2 RETURNING *`, [payment_reference || 'DIRECT-BANK', id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Payroll not found' });
            return;
        }
        res.status(200).json({ message: 'Payroll marked as paid', data: result.rows[0] });
    }
    catch (error) {
        console.error('Mark payroll paid error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.markPayrollPaid = markPayrollPaid;
// ─── DELETE PAYROLL ENTRY ─────────────────────────────────────────────────────
const deletePayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const p = yield database_1.pool.query('SELECT status FROM payrolls WHERE id = $1', [id]);
        if (p.rows.length === 0) {
            res.status(404).json({ error: 'Payroll not found' });
            return;
        }
        if (p.rows[0].status === 'paid') {
            res.status(400).json({ error: 'Cannot delete paid payroll' });
            return;
        }
        yield database_1.pool.query('DELETE FROM payrolls WHERE id = $1', [id]);
        res.status(200).json({ message: 'Payroll deleted' });
    }
    catch (error) {
        console.error('Delete payroll error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deletePayroll = deletePayroll;

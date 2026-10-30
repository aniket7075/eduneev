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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextAdmissionNumber = exports.promoteStudents = exports.assignRollNumbers = exports.getDashboardStats = exports.deleteStudent = exports.updateStudent = exports.addFamily = exports.getAllStudents = exports.deleteStaff = exports.updateStaff = exports.createStaff = exports.getAllStaff = exports.uploadImage = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const bcrypt_1 = __importDefault(require("bcrypt"));
const hr_controller_1 = require("./hr.controller");
// ─── Upload Image ────────────────────────────────────────────────────────────
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});
exports.uploadImage = uploadImage;
// ─── STAFF ───────────────────────────────────────────────────────────────────
const getAllStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.department, u.designation, u.phone_number, u.profile_picture_url, NULL AS allowed_screens,
             sp.employee_id, sp.base_salary,
             COALESCE(u.school_id, sp.school_id, us.school_id) AS school_id,
             COALESCE(s.name, s2.name, s3.name,
                      CASE 
                        WHEN LOWER(u.email) LIKE '%chikhali%' THEN 'Chikhali Branch'
                        WHEN LOWER(u.email) LIKE '%dudulgaon%' THEN 'Dudulgaon Branch'
                        ELSE 'Chinchwad Branch'
                      END
             ) AS school_name,
             COALESCE(s.name, s2.name, s3.name,
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
      LEFT JOIN schools s3 ON s3.id = u.school_id
      WHERE u.role::text IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    `;
        const params = [];
        if (tenantSchoolId) {
            query += ` AND (u.school_id = $1 OR sp.school_id = $1 OR us.school_id = $1)`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            // Non-super-admin without school_id should get empty list rather than leaking all
            res.json([]);
            return;
        }
        query += ' ORDER BY u.first_name ASC';
        const result = yield database_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllStaff = getAllStaff;
const createStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const role = req.body.role || 'teacher';
    const department = req.body.department;
    const designation = req.body.designation;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const schoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || req.body.school_id || null;
    if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ error: 'Missing required fields: email, password, first_name, last_name' });
        return;
    }
    try {
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        const result = yield database_1.pool.query(`INSERT INTO users (email, password_hash, role, first_name, last_name, department, designation, phone_number, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, email, role, first_name, last_name, department, designation, phone_number, school_id`, [email, passwordHash, role, firstName, lastName, department || null, designation || null, phoneNumber || null, schoolId]);
        const newStaff = result.rows[0];
        let employeeId = req.body.employee_id;
        if (!employeeId || employeeId === 'auto' || String(employeeId).trim() === '') {
            employeeId = yield (0, hr_controller_1.generateNextEmployeeId)(schoolId, req.body.school_name, email);
        }
        if (schoolId) {
            yield database_1.pool.query(`INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newStaff.id, schoolId]);
        }
        yield database_1.pool.query(`INSERT INTO staff_profiles (user_id, school_id, employee_id, department, designation, base_salary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         employee_id = COALESCE(EXCLUDED.employee_id, staff_profiles.employee_id),
         school_id   = COALESCE(EXCLUDED.school_id, staff_profiles.school_id),
         department  = EXCLUDED.department,
         designation = EXCLUDED.designation`, [newStaff.id, schoolId, employeeId, department || 'Teaching', designation || null, req.body.base_salary || '25000']).catch(() => null);
        newStaff.employee_id = employeeId;
        res.status(201).json(newStaff);
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email already exists' });
        }
        else {
            console.error('Create staff error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
exports.createStaff = createStaff;
const updateStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
    // Security: check if staff belongs to tenant's school
    if (!isSuper && tenantSchoolId) {
        const checkStaff = yield database_1.pool.query(`SELECT id FROM users WHERE id = $1 AND (school_id = $2 OR id IN (SELECT user_id FROM user_schools WHERE school_id = $2))`, [id, tenantSchoolId]);
        if (checkStaff.rows.length === 0) {
            res.status(403).json({ error: 'Access denied: You can only update staff from your own branch.' });
            return;
        }
    }
    const email = req.body.email;
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const role = req.body.role || 'teacher';
    const isActive = (_b = (_a = req.body.isActive) !== null && _a !== void 0 ? _a : req.body.is_active) !== null && _b !== void 0 ? _b : true;
    const department = req.body.department;
    const designation = req.body.designation;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const allowedScreensVal = req.body.allowed_screens !== undefined ? req.body.allowed_screens : (req.body.allowedScreens !== undefined ? req.body.allowedScreens : null);
    try {
        let result;
        if (allowedScreensVal !== null) {
            const allowedStr = typeof allowedScreensVal === 'string' ? allowedScreensVal : JSON.stringify(allowedScreensVal);
            result = yield database_1.pool.query(`UPDATE users 
         SET email = $1, first_name = $2, last_name = $3, role = $4, is_active = $5, 
             department = $6, designation = $7, phone_number = $8, allowed_screens = $9, updated_at = NOW() 
         WHERE id = $10
         RETURNING id, email, first_name, last_name, role, is_active, department, designation, phone_number, allowed_screens`, [email, firstName, lastName, role, isActive, department || null, designation || null, phoneNumber || null, allowedStr, id]);
        }
        else {
            result = yield database_1.pool.query(`UPDATE users 
         SET email = $1, first_name = $2, last_name = $3, role = $4, is_active = $5, 
             department = $6, designation = $7, phone_number = $8, updated_at = NOW() 
         WHERE id = $9
         RETURNING id, email, first_name, last_name, role, is_active, department, designation, phone_number, allowed_screens`, [email, firstName, lastName, role, isActive, department || null, designation || null, phoneNumber || null, id]);
        }
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        const schoolId = req.body.school_id;
        if (schoolId) {
            yield database_1.pool.query(`UPDATE users SET school_id = $1 WHERE id = $2`, [schoolId, id]);
            yield database_1.pool.query(`INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, schoolId]);
            yield database_1.pool.query(`UPDATE staff_profiles SET school_id = $1 WHERE user_id = $2`, [schoolId, id]).catch(() => null);
        }
        if (req.body.employee_id) {
            yield database_1.pool.query(`INSERT INTO staff_profiles (user_id, school_id, employee_id, department, designation)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET employee_id = EXCLUDED.employee_id, updated_at = NOW()`, [id, schoolId || null, req.body.employee_id, department || null, designation || null]).catch(() => null);
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email already exists' });
        }
        else {
            console.error('Update staff error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
exports.updateStaff = updateStaff;
const deleteStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
    if (!isSuper && tenantSchoolId) {
        const checkStaff = yield database_1.pool.query(`SELECT id FROM users WHERE id = $1 AND (school_id = $2 OR id IN (SELECT user_id FROM user_schools WHERE school_id = $2))`, [id, tenantSchoolId]);
        if (checkStaff.rows.length === 0) {
            res.status(403).json({ error: 'Access denied: You can only delete staff from your own branch.' });
            return;
        }
    }
    try {
        const result = yield database_1.pool.query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.json({ message: 'Staff deactivated successfully' });
    }
    catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteStaff = deleteStaff;
// ─── STUDENTS ────────────────────────────────────────────────────────────────
const getAllStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, grade } = req.query;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `
      SELECT 
        s.id, s.first_name, s.last_name, s.admission_number, s.roll_number, s.grade,
        s.is_active, s.profile_image_url, s.date_of_birth, s.gender,
        s.blood_group, s.created_at, s.emergency_contact_name, s.emergency_contact_phone, s.medical_notes,
        s.school_id, sch.name AS school_name, sch.name AS branch_name,
        p.name AS parent_name, p.email AS parent_email, 
        p.contact_number, p.alternative_mobile, p.address
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN schools sch ON sch.id = s.school_id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        // Strict multi-tenant isolation
        if (tenantSchoolId) {
            query += ` AND s.school_id = $${idx++}`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            // Non-super-admin with no resolved school sees nothing
            res.json([]);
            return;
        }
        if (search) {
            query += ` AND (LOWER(s.first_name) LIKE $${idx} OR LOWER(s.last_name) LIKE $${idx} OR LOWER(s.admission_number) LIKE $${idx})`;
            params.push(`%${search.toLowerCase()}%`);
            idx++;
        }
        if (grade) {
            query += ` AND s.grade = $${idx}`;
            params.push(grade);
            idx++;
        }
        query += ' ORDER BY s.first_name ASC';
        const result = yield database_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllStudents = getAllStudents;
const addFamily = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { parentName, contactNumber, alternativeMobile, address, email, password, children, school_id } = req.body;
        if (!parentName || !contactNumber || !email || !children || children.length === 0) {
            res.status(400).json({ error: 'Missing required fields: parentName, contactNumber, email, children' });
            return;
        }
        // Resolve target school_id strictly
        let resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        if (!resolvedSchoolId && (0, auth_middleware_1.isSuperAdminUser)(req)) {
            resolvedSchoolId = school_id || null;
        }
        if (!resolvedSchoolId) {
            const defaultSchool = yield client.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
            resolvedSchoolId = ((_a = defaultSchool.rows[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
        }
        yield client.query('BEGIN');
        // Insert into parents table
        const parentResult = yield client.query(`INSERT INTO parents (name, contact_number, alternative_mobile, address, email) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, contact_number = EXCLUDED.contact_number
       RETURNING id`, [parentName, contactNumber, alternativeMobile || null, address || null, email]);
        const parentId = parentResult.rows[0].id;
        // Create User login account for parent
        try {
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPw = yield bcrypt_1.default.hash(password || 'Password@123', salt);
            const nameParts = parentName.trim().split(' ');
            yield client.query(`INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, school_id)
         VALUES ($1, $2, 'parent', $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET school_id = COALESCE(users.school_id, EXCLUDED.school_id)`, [email, hashedPw, nameParts[0], nameParts.slice(1).join(' ') || '', contactNumber, resolvedSchoolId]);
        }
        catch (e) {
            console.warn('Parent user account creation note:', e.message);
        }
        // Insert each child with school_id
        const insertedChildren = [];
        for (const child of children) {
            const admissionNum = child.admissionNumber || `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const firstName = child.firstName || (child.name ? child.name.trim().split(' ')[0] : 'Unknown');
            const lastName = child.lastName || (child.name ? child.name.trim().split(' ').slice(1).join(' ') : '');
            const medicalNotes = child.medicalNotes || child.medical_notes || null;
            const childResult = yield client.query(`INSERT INTO students (parent_id, first_name, last_name, admission_number, grade, 
          date_of_birth, gender, blood_group, profile_image_url, emergency_contact_name, emergency_contact_phone, medical_notes, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, first_name, last_name, admission_number, school_id`, [
                parentId, firstName, lastName, admissionNum, child.grade || null,
                child.dateOfBirth || child.date_of_birth || null,
                child.gender || 'male',
                child.bloodGroup || null, child.profileImageUrl || null,
                child.emergencyContactName || child.emergency_contact_name || null,
                child.emergencyContactPhone || child.emergency_contact_phone || null,
                typeof medicalNotes === 'object' ? JSON.stringify(medicalNotes) : medicalNotes,
                resolvedSchoolId
            ]);
            insertedChildren.push(childResult.rows[0]);
        }
        yield client.query('COMMIT');
        // Auto-assign roll numbers alphabetically (A-Z) for each child's grade strictly within this branch
        for (const child of children) {
            if (child.grade && resolvedSchoolId) {
                const studentsInGrade = yield database_1.pool.query(`SELECT id FROM students WHERE grade = $1 AND school_id = $2 AND is_active = true ORDER BY first_name ASC`, [child.grade, resolvedSchoolId]);
                let rollNo = 1;
                for (const st of studentsInGrade.rows) {
                    yield database_1.pool.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [rollNo.toString(), st.id]);
                    rollNo++;
                }
            }
        }
        res.status(201).json({
            message: 'Family added successfully and roll numbers auto-assigned (A-Z)',
            parentId,
            children: insertedChildren
        });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Add family error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.addFamily = addFamily;
const updateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
    // Security: check if student belongs to tenant's school
    if (!isSuper && tenantSchoolId) {
        const checkSt = yield database_1.pool.query(`SELECT id FROM students WHERE id = $1 AND school_id = $2`, [id, tenantSchoolId]);
        if (checkSt.rows.length === 0) {
            res.status(403).json({ error: 'Access denied: You can only update students from your own branch.' });
            return;
        }
    }
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const admissionNumber = req.body.admissionNumber || req.body.admission_number;
    const grade = req.body.grade;
    const isActive = (_b = (_a = req.body.isActive) !== null && _a !== void 0 ? _a : req.body.is_active) !== null && _b !== void 0 ? _b : true;
    const gender = req.body.gender;
    const dateOfBirth = req.body.dateOfBirth || req.body.date_of_birth;
    const bloodGroup = req.body.bloodGroup || req.body.blood_group;
    const emergencyContactName = req.body.emergencyContactName || req.body.emergency_contact_name;
    const emergencyContactPhone = req.body.emergencyContactPhone || req.body.emergency_contact_phone;
    try {
        const result = yield database_1.pool.query(`UPDATE students 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), 
           admission_number = COALESCE($3, admission_number), 
           grade = COALESCE($4, grade),
           is_active = $5, 
           gender = COALESCE($6, gender),
           date_of_birth = COALESCE($7, date_of_birth),
           blood_group = COALESCE($8, blood_group),
           emergency_contact_name = COALESCE($9, emergency_contact_name),
           emergency_contact_phone = COALESCE($10, emergency_contact_phone),
           updated_at = NOW() 
       WHERE id = $11 RETURNING id, first_name, last_name, admission_number, grade, is_active, school_id`, [
            firstName || null,
            lastName || null,
            admissionNumber || null,
            grade || null,
            isActive,
            gender || null,
            dateOfBirth || null,
            bloodGroup || null,
            emergencyContactName || null,
            emergencyContactPhone || null,
            id
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        const studentRow = result.rows[0];
        // Auto-reassign roll numbers (A-Z) for the target grade within this branch
        if ((studentRow === null || studentRow === void 0 ? void 0 : studentRow.grade) && (studentRow === null || studentRow === void 0 ? void 0 : studentRow.school_id)) {
            const targetGrade = studentRow.grade;
            const studentsInGrade = yield database_1.pool.query(`SELECT id FROM students WHERE grade = $1 AND school_id = $2 AND is_active = true ORDER BY first_name ASC`, [targetGrade, studentRow.school_id]);
            let rollNo = 1;
            for (const st of studentsInGrade.rows) {
                yield database_1.pool.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [rollNo.toString(), st.id]);
                rollNo++;
            }
        }
        res.json({ message: 'Student updated successfully and roll numbers auto-assigned (A-Z)', student: result.rows[0] });
    }
    catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateStudent = updateStudent;
const deleteStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
    if (!isSuper && tenantSchoolId) {
        const checkSt = yield database_1.pool.query(`SELECT id FROM students WHERE id = $1 AND school_id = $2`, [id, tenantSchoolId]);
        if (checkSt.rows.length === 0) {
            res.status(403).json({ error: 'Access denied: You can only delete students from your own branch.' });
            return;
        }
    }
    try {
        const result = yield database_1.pool.query(`UPDATE students SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        res.json({ message: 'Student deactivated successfully' });
    }
    catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteStudent = deleteStudent;
// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const todayStr = new Date().toISOString().split('T')[0];
        // If user is non-super-admin but has no school_id, return empty zeroes
        if (!isSuper && !tenantSchoolId) {
            res.json({
                totalStudents: 0,
                totalTeachers: 0,
                totalStaff: 0,
                todayAttendance: '0/0',
                attendancePercent: 0,
                pendingFees: 0,
                todayCollected: 0,
                recentActivities: [],
                graphs: { enquiriesVsAdmissions: [], feesCollection: [] }
            });
            return;
        }
        const [studentRes, teacherRes, staffRes, attendanceRes, pendingFeesRes, collectedFeesRes, logsRes, enqVSadmRes, feesTrendRes, homeworkRes, notesRes, noticesRes] = yield Promise.all([
            database_1.pool.query(`SELECT COUNT(*) as count FROM students 
         WHERE is_active = true 
           AND ($1::text IS NULL OR school_id::text = $1::text)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT COUNT(DISTINCT u.id) as count 
         FROM users u 
         LEFT JOIN user_schools us ON us.user_id = u.id
         WHERE u.role::text IN ('teacher', 'school_admin') AND u.is_active = true
           AND ($1::text IS NULL OR us.school_id::text = $1::text OR u.school_id::text = $1::text)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT COUNT(DISTINCT u.id) as count 
         FROM users u 
         LEFT JOIN user_schools us ON us.user_id = u.id
         WHERE u.role::text IN ('non_teaching_staff', 'school_admin') AND u.is_active = true
           AND ($1::text IS NULL OR us.school_id::text = $1::text OR u.school_id::text = $1::text)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT a.status, COUNT(*) as count 
         FROM attendance a
         JOIN students st ON a.student_id = st.id
         WHERE a.date = $1
           AND ($2::text IS NULL OR st.school_id::text = $2::text)
         GROUP BY a.status`, [todayStr, tenantSchoolId]),
            database_1.pool.query(`SELECT COALESCE(SUM(sf.amount_due), 0) as total 
         FROM student_fees sf
         JOIN students st ON sf.student_id = st.id
         WHERE sf.status IN ('pending','overdue','partial')
           AND ($1::text IS NULL OR st.school_id::text = $1::text)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT COALESCE(SUM(p.amount_paid), 0) as total 
         FROM payments p
         JOIN student_fees sf ON p.student_fee_id = sf.id
         JOIN students st ON sf.student_id = st.id
         WHERE DATE(p.payment_date) = $1
           AND ($2::text IS NULL OR st.school_id::text = $2::text)`, [todayStr, tenantSchoolId]),
            database_1.pool.query("SELECT action, entity_type as \"entityType\", created_at as \"createdAt\" FROM audit_logs ORDER BY created_at DESC LIMIT 8").catch(() => ({ rows: [] })),
            database_1.pool.query(`
        SELECT TO_CHAR(m.month, 'Mon') as name,
               COALESCE(e.cnt, 0)::int as enquiries,
               COALESCE(s.cnt, 0)::int as admissions
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
          )::date as month
        ) m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at)::date as month, COUNT(*) as cnt 
          FROM enquiries 
          WHERE ($1::text IS NULL OR school_id::text = $1::text)
          GROUP BY 1
        ) e ON m.month = e.month
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at)::date as month, COUNT(*) as cnt 
          FROM students 
          WHERE is_active = true 
            AND ($1::text IS NULL OR school_id::text = $1::text)
          GROUP BY 1
        ) s ON m.month = s.month
        ORDER BY m.month ASC
      `, [tenantSchoolId]),
            database_1.pool.query(`
        SELECT TO_CHAR(m.month, 'Mon') as name,
               COALESCE(p.collected, 0)::float as collected,
               COALESCE(f.pending, 0)::float as pending
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
          )::date as month
        ) m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', p.payment_date)::date as month, SUM(p.amount_paid) as collected 
          FROM payments p
          JOIN student_fees sf ON p.student_fee_id = sf.id
          JOIN students st ON sf.student_id = st.id
          WHERE ($1::text IS NULL OR st.school_id::text = $1::text)
          GROUP BY 1
        ) p ON m.month = p.month
        LEFT JOIN (
          SELECT DATE_TRUNC('month', sf.due_date)::date as month, SUM(sf.amount_due) as pending 
          FROM student_fees sf
          JOIN students st ON sf.student_id = st.id
          WHERE sf.status IN ('pending', 'overdue', 'partial')
            AND ($1::text IS NULL OR st.school_id::text = $1::text)
          GROUP BY 1
        ) f ON m.month = f.month
        ORDER BY m.month ASC
      `, [tenantSchoolId]),
            database_1.pool.query(`SELECT COUNT(*) as count FROM homework 
         WHERE ($1::text IS NULL OR school_id::text = $1::text OR school_id IS NULL)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT COUNT(*) as count FROM student_notes sn
         JOIN students st ON sn.student_id = st.id
         WHERE ($1::text IS NULL OR st.school_id::text = $1::text)`, [tenantSchoolId]),
            database_1.pool.query(`SELECT id, title, content, target_audience as "targetAudience", created_at as "createdAt"
         FROM notices
         WHERE ($1::text IS NULL OR school_id::text = $1::text OR school_id IS NULL)
         ORDER BY created_at DESC LIMIT 5`, [tenantSchoolId])
        ]);
        const totalStudents = parseInt(studentRes.rows[0].count || '0');
        const totalTeachers = parseInt(teacherRes.rows[0].count || '0');
        const totalStaff = parseInt(staffRes.rows[0].count || '0');
        const grandStaffTotal = totalTeachers + totalStaff;
        let present = 0;
        let totalAttendance = 0;
        attendanceRes.rows.forEach(row => {
            const cnt = parseInt(row.count);
            totalAttendance += cnt;
            if (['present', 'late'].includes(row.status.toLowerCase()))
                present += cnt;
        });
        const pendingFees = parseFloat(((_a = pendingFeesRes.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0');
        const todayCollected = parseFloat(((_b = collectedFeesRes.rows[0]) === null || _b === void 0 ? void 0 : _b.total) || '0');
        const activeHomework = parseInt(((_c = homeworkRes.rows[0]) === null || _c === void 0 ? void 0 : _c.count) || '0');
        const totalStudentNotes = parseInt(((_d = notesRes.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0');
        const recentNotices = noticesRes.rows || [];
        res.json({
            totalStudents,
            totalTeachers: grandStaffTotal,
            totalStaff,
            todayAttendance: totalAttendance > 0 ? `${present}/${totalAttendance}` : `0/${totalStudents}`,
            attendancePresent: present,
            attendanceTotal: totalAttendance > 0 ? totalAttendance : totalStudents,
            attendancePercent: totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0,
            pendingFees,
            todayCollected,
            activeHomework,
            totalStudentNotes,
            recentNotices,
            recentActivities: logsRes.rows,
            graphs: {
                enquiriesVsAdmissions: enqVSadmRes.rows,
                feesCollection: feesTrendRes.rows
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(200).json({
            totalStudents: 0,
            totalTeachers: 0,
            totalStaff: 0,
            todayAttendance: '0/0',
            attendancePresent: 0,
            attendanceTotal: 0,
            attendancePercent: 0,
            pendingFees: 0,
            todayCollected: 0,
            activeHomework: 0,
            totalStudentNotes: 0,
            recentNotices: [],
            recentActivities: [],
            graphs: { enquiriesVsAdmissions: [], feesCollection: [] }
        });
    }
});
exports.getDashboardStats = getDashboardStats;
// ─── PROMOTE STUDENTS ─────────────────────────────────────────────────────────
const assignRollNumbers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { grade } = req.body;
    const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    if (!grade) {
        res.status(400).json({ error: 'grade is required' });
        return;
    }
    try {
        let query = `SELECT id FROM students WHERE grade = $1 AND is_active = true`;
        const params = [grade];
        if (tenantSchoolId) {
            query += ` AND school_id = $2`;
            params.push(tenantSchoolId);
        }
        query += ` ORDER BY first_name ASC`;
        const studentsRes = yield database_1.pool.query(query, params);
        let rollNo = 1;
        for (const student of studentsRes.rows) {
            yield database_1.pool.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [rollNo.toString(), student.id]);
            rollNo++;
        }
        res.json({ message: `Successfully assigned roll numbers to ${studentsRes.rows.length} students in grade ${grade}` });
    }
    catch (error) {
        console.error('Assign roll numbers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.assignRollNumbers = assignRollNumbers;
const promoteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fromGrade, toGrade, studentIds, school_id } = req.body;
    let tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
    if (!tenantSchoolId && school_id && (0, auth_middleware_1.isSuperAdminUser)(req)) {
        tenantSchoolId = school_id;
    }
    if (!fromGrade || !toGrade) {
        res.status(400).json({ error: 'fromGrade and toGrade are required' });
        return;
    }
    if (fromGrade === toGrade) {
        res.status(400).json({ error: 'Source and destination classes cannot be the same' });
        return;
    }
    if (studentIds !== undefined && (!Array.isArray(studentIds) || studentIds.length === 0)) {
        res.status(400).json({ error: 'Please select at least one student to promote' });
        return;
    }
    try {
        let updateQuery;
        let updateParams;
        if (Array.isArray(studentIds) && studentIds.length > 0) {
            updateQuery = `UPDATE students SET grade = $1, updated_at = NOW() WHERE id = ANY($2) AND grade = $3 AND is_active = true`;
            updateParams = [toGrade, studentIds, fromGrade];
            if (tenantSchoolId) {
                updateQuery += ` AND school_id = $4`;
                updateParams.push(tenantSchoolId);
            }
        }
        else {
            updateQuery = `UPDATE students SET grade = $1, updated_at = NOW() WHERE grade = $2 AND is_active = true`;
            updateParams = [toGrade, fromGrade];
            if (tenantSchoolId) {
                updateQuery += ` AND school_id = $3`;
                updateParams.push(tenantSchoolId);
            }
        }
        updateQuery += ` RETURNING id`;
        const result = yield database_1.pool.query(updateQuery, updateParams);
        if (result.rows.length === 0) {
            res.status(404).json({ error: `No active students found in ${fromGrade} to promote.` });
            return;
        }
        // Auto-assign roll numbers for the new class (toGrade)
        let reassignQuery = `SELECT id FROM students WHERE grade = $1 AND is_active = true`;
        const reassignParams = [toGrade];
        if (tenantSchoolId) {
            reassignQuery += ` AND school_id = $2`;
            reassignParams.push(tenantSchoolId);
        }
        reassignQuery += ` ORDER BY first_name ASC`;
        const studentsRes = yield database_1.pool.query(reassignQuery, reassignParams);
        let rollNo = 1;
        for (const student of studentsRes.rows) {
            yield database_1.pool.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [rollNo.toString(), student.id]);
            rollNo++;
        }
        // Auto-reassign roll numbers for remaining students in fromGrade
        let reassignFromQuery = `SELECT id FROM students WHERE grade = $1 AND is_active = true`;
        const reassignFromParams = [fromGrade];
        if (tenantSchoolId) {
            reassignFromQuery += ` AND school_id = $2`;
            reassignFromParams.push(tenantSchoolId);
        }
        reassignFromQuery += ` ORDER BY first_name ASC`;
        const fromStudentsRes = yield database_1.pool.query(reassignFromQuery, reassignFromParams);
        let fromRollNo = 1;
        for (const student of fromStudentsRes.rows) {
            yield database_1.pool.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [fromRollNo.toString(), student.id]);
            fromRollNo++;
        }
        res.json({
            message: `Successfully promoted ${result.rows.length} student(s) from ${fromGrade} to ${toGrade} and assigned roll numbers`,
            promotedCount: result.rows.length
        });
    }
    catch (error) {
        console.error('Promote students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.promoteStudents = promoteStudents;
const getNextAdmissionNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { grade } = req.query;
        const gradeStr = grade || 'Nursery';
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const GRADE_PREFIXES = {
            'Playgroup': 'PG',
            'Nursery': 'NUR',
            'Jr KG': 'JKG',
            'Sr KG': 'SKG',
            'Daycare': 'DC',
            'LKG': 'JKG',
            'UKG': 'SKG',
            'Kg': 'KG',
            'KG': 'KG'
        };
        let prefix = GRADE_PREFIXES[gradeStr];
        if (!prefix) {
            const clean = gradeStr.trim().replace(/[^a-zA-Z0-9\s]/g, '');
            const words = clean.split(/\s+/);
            if (words.length > 1) {
                prefix = words.map(w => { var _a; return (_a = w[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); }).join('');
            }
            else {
                prefix = clean.length <= 3 ? clean.toUpperCase() : clean.substring(0, 3).toUpperCase();
            }
        }
        let query = `SELECT admission_number FROM students WHERE (admission_number LIKE $1 OR grade = $2)`;
        const params = [`${prefix}-%`, gradeStr];
        if (tenantSchoolId) {
            query += ` AND school_id = $3`;
            params.push(tenantSchoolId);
        }
        const result = yield database_1.pool.query(query, params);
        let maxNum = 0;
        for (const row of result.rows) {
            if (row.admission_number) {
                const parts = row.admission_number.split('-');
                const lastPart = parts[parts.length - 1];
                const num = parseInt(lastPart, 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        }
        const nextNumber = `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
        res.json({ prefix, nextNumber, grade: gradeStr });
    }
    catch (error) {
        console.error('Get next admission number error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getNextAdmissionNumber = getNextAdmissionNumber;

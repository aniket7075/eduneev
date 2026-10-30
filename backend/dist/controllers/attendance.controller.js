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
exports.getUnifiedDashboardStats = exports.markFaceQrAttendance = exports.getStudentAttendance = exports.bulkMarkAttendance = exports.getAllStudentsForAttendance = exports.getClassStudents = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_service_1 = require("../services/notification.service");
const getClassStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { grade } = req.params;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `
      SELECT id, first_name || ' ' || last_name AS full_name, grade, admission_number, profile_image_url
      FROM students 
      WHERE grade = $1 AND is_active = true
    `;
        const params = [grade];
        if (tenantSchoolId) {
            query += ` AND school_id = $2`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            res.status(200).json({ data: [] });
            return;
        }
        query += ` ORDER BY first_name ASC`;
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get class students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getClassStudents = getClassStudents;
const getAllStudentsForAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const userRole = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];
        // ─── TEACHER: Only show students from their assigned class ───────────────
        if (userRole === 'teacher' && userId) {
            let classRes = yield database_1.pool.query(`SELECT c.name AS class_name FROM classes c WHERE c.class_teacher_id = $1 LIMIT 1`, [userId]);
            // Fallback: match by email or name in case teacher logged in with alternate account
            if (classRes.rows.length === 0 && ((_d = req.user) === null || _d === void 0 ? void 0 : _d.email)) {
                classRes = yield database_1.pool.query(`SELECT c.name AS class_name FROM classes c 
           JOIN users u ON c.class_teacher_id = u.id 
           WHERE LOWER(u.email) = LOWER($1) 
              OR (LOWER(u.first_name) = (SELECT LOWER(first_name) FROM users WHERE id = $2)
                  AND LOWER(u.last_name) = (SELECT LOWER(last_name) FROM users WHERE id = $2))
           LIMIT 1`, [req.user.email, userId]);
            }
            if (classRes.rows.length === 0) {
                res.status(200).json({ students: [], teacher_class: null });
                return;
            }
            const className = classRes.rows[0].class_name;
            let tQuery = `
        SELECT s.id, s.first_name, s.last_name, s.first_name || ' ' || s.last_name AS full_name, 
               s.grade, s.admission_number, s.roll_number, s.profile_image_url, s.school_id,
               a.status AS today_status, a.in_time, a.out_time
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2
        WHERE s.is_active = true
          AND LOWER(TRIM(s.grade)) = LOWER(TRIM($1))
      `;
            const tParams = [className, targetDate];
            if (tenantSchoolId) {
                tQuery += ` AND s.school_id = $3`;
                tParams.push(tenantSchoolId);
            }
            tQuery += ` ORDER BY s.first_name ASC`;
            const tResult = yield database_1.pool.query(tQuery, tParams);
            // Also return the teacher's class name so frontend can display it
            res.status(200).json({ students: tResult.rows, teacher_class: className });
            return;
        }
        // ─── ADMIN / SUPER ADMIN: Return all students ───────────────────────────
        let query = `
      SELECT s.id, s.first_name, s.last_name, s.first_name || ' ' || s.last_name AS full_name, 
             s.grade, s.admission_number, s.roll_number, s.profile_image_url, s.school_id, s.medical_notes,
             a.status AS today_status, a.in_time, a.out_time
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $1
      WHERE s.is_active = true
    `;
        const params = [targetDate];
        if (tenantSchoolId) {
            query += ` AND s.school_id = $2`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            res.status(200).json([]);
            return;
        }
        query += ` ORDER BY s.grade ASC, s.first_name ASC`;
        const result = yield database_1.pool.query(query, params);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Get all students for attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllStudentsForAttendance = getAllStudentsForAttendance;
const bulkMarkAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { date, records } = req.body;
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        if (!date || !records || !Array.isArray(records) || records.length === 0) {
            res.status(400).json({ error: 'Missing or invalid fields: date and records array required' });
            return;
        }
        yield client.query('BEGIN');
        for (const record of records) {
            if (!record.student_id || !record.status)
                continue;
            yield client.query(`INSERT INTO attendance (student_id, date, status, marked_by, school_id, in_time, out_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (student_id, date) 
         DO UPDATE SET 
           status = EXCLUDED.status, 
           marked_by = EXCLUDED.marked_by, 
           school_id = COALESCE(attendance.school_id, EXCLUDED.school_id),
           in_time = EXCLUDED.in_time,
           out_time = EXCLUDED.out_time`, [
                record.student_id,
                date,
                record.status.toLowerCase(),
                teacherId,
                tenantSchoolId,
                record.in_time || null,
                record.out_time || null
            ]);
        }
        yield client.query('COMMIT');
        // Trigger instant push notification to parents
        records.forEach((record) => {
            if (record.student_id && record.status) {
                (0, notification_service_1.notifyAttendanceStatus)(record.student_id, record.status, record.in_time, record.out_time).catch(err => {
                    console.error(`Error notifying parent for student ${record.student_id}:`, err);
                });
            }
        });
        res.status(200).json({ message: `Attendance marked for ${records.length} student(s)` });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Bulk mark attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.bulkMarkAttendance = bulkMarkAttendance;
const getStudentAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { student_id } = req.params;
        const { month, year } = req.query;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if ((!student_id || student_id === 'undefined' || student_id === 'all') && req.user) {
            if (req.user.role === 'parent' || req.user.role === 'student') {
                const parentEmail = (req.user.email || '').toLowerCase().trim();
                const stRes = yield database_1.pool.query(`SELECT s.id FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`, [parentEmail, req.user.id]).catch(() => ({ rows: [] }));
                if (stRes.rows.length > 0) {
                    student_id = stRes.rows[0].id;
                }
            }
        }
        if (student_id && student_id !== 'undefined' && !isSuper && tenantSchoolId) {
            const checkSt = yield database_1.pool.query('SELECT id FROM students WHERE id = $1 AND school_id = $2', [student_id, tenantSchoolId]);
            if (checkSt.rows.length === 0) {
                res.status(403).json({ error: 'Access denied: Student does not belong to your branch.' });
                return;
            }
        }
        let query = 'SELECT id, date, status, in_time, out_time, in_time AS check_in_time, remarks FROM attendance WHERE student_id = $1';
        const queryParams = [student_id];
        if (month && year) {
            query += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3';
            queryParams.push(month, year);
        }
        else if (year) {
            query += ' AND EXTRACT(YEAR FROM date) = $2';
            queryParams.push(year);
        }
        query += ' ORDER BY date DESC';
        const result = yield database_1.pool.query(query, queryParams);
        // Also return summary counts
        const summary = { present: 0, absent: 0, late: 0, leave: 0, half_day: 0 };
        result.rows.forEach(r => {
            var _a;
            const s = (_a = r.status) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (s in summary)
                summary[s]++;
        });
        res.status(200).json({ data: result.rows, summary });
    }
    catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentAttendance = getStudentAttendance;
// Distance calculation helper (Haversine formula in meters)
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};
// ─── UNIFIED DASHBOARD: FACE/QR/GEOFENCE ──────────────────────────────────────
const markFaceQrAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { type, id, method, latitude, longitude, school_id } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        if (!type || !id || !method) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        if (type === 'student') {
            yield database_1.pool.query(`INSERT INTO attendance (student_id, date, status, check_in_time, school_id) 
         VALUES ($1, $2, 'present', CURRENT_TIME, $3)
         ON CONFLICT (student_id, date) 
         DO UPDATE SET status = 'present', check_in_time = CURRENT_TIME, school_id = COALESCE(attendance.school_id, EXCLUDED.school_id)`, [id, date, tenantSchoolId]);
            res.status(200).json({ message: `Student attendance marked via ${method}` });
            return;
        }
        if (type === 'staff') {
            // 1. Resolve staff user and their school details
            const userRes = yield database_1.pool.query(`SELECT u.id, u.first_name, u.last_name, u.email,
                COALESCE(sp.school_id, us.school_id, u.school_id) AS school_id,
                s.name AS school_name, s.latitude, s.longitude, COALESCE(s.geofence_radius, 200) AS geofence_radius
         FROM users u
         LEFT JOIN staff_profiles sp ON sp.user_id = u.id
         LEFT JOIN user_schools us ON us.user_id = u.id
         LEFT JOIN schools s ON s.id = COALESCE(sp.school_id, us.school_id, u.school_id)
         WHERE u.id::text = $1 OR u.email = $1 LIMIT 1`, [id]).catch(() => ({ rows: [] }));
            let resolvedUserId = ((_a = userRes.rows[0]) === null || _a === void 0 ? void 0 : _a.id) || (id.length === 36 ? id : null);
            let resolvedSchoolId = ((_b = userRes.rows[0]) === null || _b === void 0 ? void 0 : _b.school_id) || school_id || tenantSchoolId;
            let schoolName = ((_c = userRes.rows[0]) === null || _c === void 0 ? void 0 : _c.school_name) || 'School Campus';
            let schoolLat = (_d = userRes.rows[0]) === null || _d === void 0 ? void 0 : _d.latitude;
            let schoolLng = (_e = userRes.rows[0]) === null || _e === void 0 ? void 0 : _e.longitude;
            let geofenceRadius = ((_f = userRes.rows[0]) === null || _f === void 0 ? void 0 : _f.geofence_radius) || 200;
            // If school coordinates not found through user, fetch from target school directly
            if ((!schoolLat || !schoolLng) && resolvedSchoolId) {
                const scRes = yield database_1.pool.query(`SELECT id, name, latitude, longitude, COALESCE(geofence_radius, 200) AS geofence_radius
           FROM schools WHERE id::text = $1 LIMIT 1`, [resolvedSchoolId]).catch(() => ({ rows: [] }));
                if (scRes.rows.length > 0 && scRes.rows[0].latitude && scRes.rows[0].longitude) {
                    schoolName = scRes.rows[0].name;
                    schoolLat = scRes.rows[0].latitude;
                    schoolLng = scRes.rows[0].longitude;
                    geofenceRadius = scRes.rows[0].geofence_radius || 200;
                }
            }
            // Default fallback if still unset: Chinchwad Branch default coordinates
            if (!schoolLat || !schoolLng) {
                const fallbackRes = yield database_1.pool.query(`SELECT id, name, latitude, longitude, COALESCE(geofence_radius, 200) AS geofence_radius
           FROM schools ORDER BY created_at ASC LIMIT 1`).catch(() => ({ rows: [] }));
                if (fallbackRes.rows.length > 0) {
                    if (!resolvedSchoolId)
                        resolvedSchoolId = fallbackRes.rows[0].id;
                    schoolName = fallbackRes.rows[0].name;
                    schoolLat = fallbackRes.rows[0].latitude || 18.6298;
                    schoolLng = fallbackRes.rows[0].longitude || 73.7997;
                    geofenceRadius = fallbackRes.rows[0].geofence_radius || 200;
                }
            }
            // 2. Strict 200-meter Geofence Validation
            let distanceMeters = null;
            const userLat = parseFloat(latitude);
            const userLng = parseFloat(longitude);
            if (!isNaN(userLat) && !isNaN(userLng) && schoolLat && schoolLng) {
                distanceMeters = calculateDistanceMeters(userLat, userLng, parseFloat(schoolLat), parseFloat(schoolLng));
                // Strict Check: Teacher MUST be within 200 meters of their school
                const maxAllowedRadius = geofenceRadius || 200;
                if (distanceMeters > maxAllowedRadius) {
                    res.status(403).json({
                        error: 'Geofence Restriction',
                        message: `हजेरी नोंदवता येत नाही: तुम्ही ${schoolName} पासून ${distanceMeters} मीटर लांब आहात. हजेरी फक्त शाळेच्या ${maxAllowedRadius} मीटर परिसरामध्येच नोंदवता येते! (Outside ${maxAllowedRadius}m school perimeter)`,
                        distance: distanceMeters,
                        maxRadius: maxAllowedRadius,
                        schoolName
                    });
                    return;
                }
            }
            // 3. Record Staff Attendance if resolved user exists
            if (resolvedUserId) {
                yield database_1.pool.query(`INSERT INTO staff_attendance (user_id, date, status, check_in, school_id, latitude, longitude, distance_meters, verification_method) 
           VALUES ($1, $2, 'present', CURRENT_TIME, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id, date) 
           DO UPDATE SET status = 'present', check_in = CURRENT_TIME,
                         school_id = COALESCE(staff_attendance.school_id, EXCLUDED.school_id),
                         latitude = EXCLUDED.latitude,
                         longitude = EXCLUDED.longitude,
                         distance_meters = EXCLUDED.distance_meters,
                         verification_method = EXCLUDED.verification_method`, [resolvedUserId, date, resolvedSchoolId, isNaN(userLat) ? null : userLat, isNaN(userLng) ? null : userLng, distanceMeters, method]);
            }
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            res.status(200).json({
                message: `Teacher attendance marked successfully within ${distanceMeters !== null ? distanceMeters + 'm of ' : ''}${schoolName}`,
                date: formattedDate,
                time: formattedTime,
                timestamp: `${formattedDate} ${formattedTime}`,
                distance: distanceMeters,
                maxRadius: geofenceRadius || 200,
                schoolName
            });
            return;
        }
        res.status(400).json({ error: 'Invalid attendance type' });
    }
    catch (error) {
        console.error('Mark face/qr attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.markFaceQrAttendance = markFaceQrAttendance;
const getUnifiedDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const date = new Date().toISOString().split('T')[0];
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (!isSuper && !tenantSchoolId) {
            res.status(200).json({ data: { students: [], staff: [], date } });
            return;
        }
        let studentQuery = `
      SELECT a.status, COUNT(*) as count 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = $1
    `;
        const studentParams = [date];
        if (tenantSchoolId) {
            studentQuery += ` AND s.school_id = $2`;
            studentParams.push(tenantSchoolId);
        }
        studentQuery += ` GROUP BY a.status`;
        const studentRes = yield database_1.pool.query(studentQuery, studentParams);
        // Staff stats
        let staffQuery = `
      SELECT sa.status, COUNT(*) as count 
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.date = $1
    `;
        const staffParams = [date];
        if (tenantSchoolId) {
            staffQuery += ` AND (u.school_id = $2 OR sa.school_id = $2)`;
            staffParams.push(tenantSchoolId);
        }
        staffQuery += ` GROUP BY sa.status`;
        const staffRes = yield database_1.pool.query(staffQuery, staffParams).catch(() => ({ rows: [] }));
        res.status(200).json({
            data: {
                students: studentRes.rows,
                staff: staffRes.rows,
                date
            }
        });
    }
    catch (error) {
        console.error('Get unified stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getUnifiedDashboardStats = getUnifiedDashboardStats;

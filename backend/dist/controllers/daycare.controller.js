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
exports.getMonthlyReport = exports.getDaycareStudents = exports.getDaycareRatio = exports.deleteDaycareSchedule = exports.createDaycareSchedule = exports.getDaycareSchedules = exports.bulkCreateDaycareLogs = exports.deleteDaycareLog = exports.updateDaycareLog = exports.createDaycareLog = exports.getDaycareLogById = exports.getDaycareLogs = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// ─── GET ALL DAYCARE LOGS FOR A CLASS / DATE ──────────────────────────────────
const getDaycareLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, student_id } = req.query;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (!isSuper && !resolvedSchoolId) {
            res.status(200).json({ data: [] });
            return;
        }
        let query = `
      SELECT dl.*,
             s.first_name || ' ' || s.last_name AS student_name,
             s.profile_image_url AS photo_url,
             u.first_name || ' ' || u.last_name AS logged_by_name
      FROM daycare_logs dl
      JOIN students s ON dl.student_id = s.id
      LEFT JOIN users u ON dl.logged_by = u.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        if (student_id) {
            query += ` AND dl.student_id = $${idx++}`;
            params.push(student_id);
        }
        if (date) {
            query += ` AND dl.date = $${idx++}`;
            params.push(date);
        }
        if (resolvedSchoolId) {
            query += ` AND s.school_id = $${idx++}`;
            params.push(resolvedSchoolId);
        }
        query += ' ORDER BY dl.date DESC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get daycare logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDaycareLogs = getDaycareLogs;
// ─── GET SINGLE DAYCARE LOG ───────────────────────────────────────────────────
const getDaycareLogById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query(`SELECT dl.*,
              s.first_name || ' ' || s.last_name AS student_name,
              s.profile_image_url AS photo_url
       FROM daycare_logs dl
       JOIN students s ON dl.student_id = s.id
       WHERE dl.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Daycare log not found' });
            return;
        }
        res.status(200).json({ data: result.rows[0] });
    }
    catch (error) {
        console.error('Get daycare log error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDaycareLogById = getDaycareLogById;
// ─── CREATE DAYCARE LOG ───────────────────────────────────────────────────────
const createDaycareLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { student_id, date, activity_type, check_in_time, check_out_time, meals, nap_start, nap_end, mood, water_intake, washroom_visits, learning_activity, teacher_notes, parent_visible, nap_quality, diaper_status, health_status, energy_level, temperature, medicine_given, medicine_note, activity_tags, snacks_notes, parent_message, } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!student_id || !date) {
            res.status(400).json({ error: 'student_id and date are required' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO daycare_logs
         (student_id, date, activity_type, check_in_time, check_out_time, meals, nap_start, nap_end,
          mood, water_intake, washroom_visits, learning_activity, teacher_notes,
          parent_visible, logged_by,
          nap_quality, diaper_status, health_status, energy_level,
          temperature, medicine_given, medicine_note, activity_tags,
          snacks_notes, parent_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       ON CONFLICT (student_id, date)
       DO UPDATE SET
         activity_type = EXCLUDED.activity_type,
         check_in_time = EXCLUDED.check_in_time,
         check_out_time = EXCLUDED.check_out_time,
         meals = EXCLUDED.meals,
         nap_start = EXCLUDED.nap_start,
         nap_end = EXCLUDED.nap_end,
         mood = EXCLUDED.mood,
         water_intake = EXCLUDED.water_intake,
         washroom_visits = EXCLUDED.washroom_visits,
         learning_activity = EXCLUDED.learning_activity,
         teacher_notes = EXCLUDED.teacher_notes,
         parent_visible = EXCLUDED.parent_visible,
         logged_by = EXCLUDED.logged_by,
         nap_quality = EXCLUDED.nap_quality,
         diaper_status = EXCLUDED.diaper_status,
         health_status = EXCLUDED.health_status,
         energy_level = EXCLUDED.energy_level,
         temperature = EXCLUDED.temperature,
         medicine_given = EXCLUDED.medicine_given,
         medicine_note = EXCLUDED.medicine_note,
         activity_tags = EXCLUDED.activity_tags,
         snacks_notes = EXCLUDED.snacks_notes,
         parent_message = EXCLUDED.parent_message
       RETURNING *`, [
            student_id, date,
            activity_type || 'Daily Log',
            check_in_time || null, check_out_time || null,
            meals ? JSON.stringify(meals) : '{}',
            nap_start || null, nap_end || null,
            mood || null, water_intake || null,
            washroom_visits || 0,
            learning_activity || null, teacher_notes || null,
            parent_visible !== undefined ? parent_visible : true,
            userId,
            nap_quality || 'deep',
            diaper_status || 'dry',
            health_status || 'healthy',
            energy_level || 'medium',
            temperature || null,
            medicine_given || 'none',
            medicine_note || null,
            activity_tags || null,
            snacks_notes || null,
            parent_message || null,
        ]);
        res.status(201).json({ message: 'Daycare log saved', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create daycare log error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createDaycareLog = createDaycareLog;
// ─── UPDATE DAYCARE LOG ───────────────────────────────────────────────────────
const updateDaycareLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { check_in_time, check_out_time, meals, nap_start, nap_end, mood, water_intake, washroom_visits, learning_activity, teacher_notes, parent_visible, } = req.body;
        const result = yield database_1.pool.query(`UPDATE daycare_logs SET
         check_in_time     = COALESCE($1, check_in_time),
         check_out_time    = COALESCE($2, check_out_time),
         meals             = COALESCE($3, meals),
         nap_start         = COALESCE($4, nap_start),
         nap_end           = COALESCE($5, nap_end),
         mood              = COALESCE($6, mood),
         water_intake      = COALESCE($7, water_intake),
         washroom_visits   = COALESCE($8, washroom_visits),
         learning_activity = COALESCE($9, learning_activity),
         teacher_notes     = COALESCE($10, teacher_notes),
         parent_visible    = COALESCE($11, parent_visible)
       WHERE id = $12
       RETURNING *`, [
            check_in_time, check_out_time,
            meals ? JSON.stringify(meals) : null,
            nap_start, nap_end, mood, water_intake,
            washroom_visits, learning_activity,
            teacher_notes, parent_visible, id,
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Daycare log not found' });
            return;
        }
        res.status(200).json({ message: 'Daycare log updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update daycare log error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateDaycareLog = updateDaycareLog;
// ─── DELETE DAYCARE LOG ───────────────────────────────────────────────────────
const deleteDaycareLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query('DELETE FROM daycare_logs WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Daycare log not found' });
            return;
        }
        res.status(200).json({ message: 'Daycare log deleted' });
    }
    catch (error) {
        console.error('Delete daycare log error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteDaycareLog = deleteDaycareLog;
// ─── BULK LOG FOR ENTIRE CLASS ────────────────────────────────────────────────
const bulkCreateDaycareLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        const { date, logs } = req.body; // logs = [{ student_id, mood, meals, ... }]
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!date || !Array.isArray(logs) || logs.length === 0) {
            res.status(400).json({ error: 'date and logs[] are required' });
            return;
        }
        yield client.query('BEGIN');
        for (const log of logs) {
            yield client.query(`INSERT INTO daycare_logs
           (student_id, date, meals, mood, water_intake, washroom_visits,
            learning_activity, teacher_notes, check_in_time, check_out_time, logged_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (student_id, date)
         DO UPDATE SET
           meals = EXCLUDED.meals, mood = EXCLUDED.mood,
           water_intake = EXCLUDED.water_intake,
           washroom_visits = EXCLUDED.washroom_visits,
           learning_activity = EXCLUDED.learning_activity,
           teacher_notes = EXCLUDED.teacher_notes,
           check_in_time = EXCLUDED.check_in_time,
           check_out_time = EXCLUDED.check_out_time,
           logged_by = EXCLUDED.logged_by`, [
                log.student_id, date,
                log.meals ? JSON.stringify(log.meals) : '{}',
                log.mood || null, log.water_intake || null,
                log.washroom_visits || 0,
                log.learning_activity || null, log.teacher_notes || log.notes || null,
                log.check_in_time || null, log.check_out_time || null,
                userId,
            ]);
        }
        yield client.query('COMMIT');
        res.status(201).json({ message: `Daycare logged for ${logs.length} student(s)` });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Bulk daycare log error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.bulkCreateDaycareLogs = bulkCreateDaycareLogs;
// ─── GET DAYCARE SCHEDULES ────────────────────────────────────────────────────
const getDaycareSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.query;
        let query = `SELECT * FROM daycare_schedules WHERE is_active = true`;
        const params = [];
        if (school_id) {
            query += ` AND school_id = $1`;
            params.push(school_id);
        }
        query += ' ORDER BY schedule_time ASC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDaycareSchedules = getDaycareSchedules;
// ─── CREATE DAYCARE SCHEDULE ──────────────────────────────────────────────────
const createDaycareSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, schedule_time, days_of_week, school_id } = req.body;
        if (!title || !schedule_time) {
            res.status(400).json({ error: 'title and schedule_time are required' });
            return;
        }
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                resolvedSchoolId = s.rows[0].id;
        }
        const result = yield database_1.pool.query(`INSERT INTO daycare_schedules (school_id, title, description, schedule_time, days_of_week)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`, [resolvedSchoolId, title, description || null, schedule_time, days_of_week || [1, 2, 3, 4, 5]]);
        res.status(201).json({ message: 'Schedule created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createDaycareSchedule = createDaycareSchedule;
// ─── DELETE DAYCARE SCHEDULE ──────────────────────────────────────────────────
const deleteDaycareSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.pool.query('UPDATE daycare_schedules SET is_active = false WHERE id = $1', [id]);
        res.status(200).json({ message: 'Schedule removed' });
    }
    catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteDaycareSchedule = deleteDaycareSchedule;
// ─── GET DAYCARE RATIO (REAL DB COUNT) ───────────────────────────────────────
const getDaycareRatio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const today = new Date().toISOString().split('T')[0];
        const kidsResult = yield database_1.pool.query(`SELECT COUNT(DISTINCT student_id) FROM daycare_logs WHERE date = $1 AND check_in_time IS NOT NULL AND (check_out_time IS NULL OR check_out_time = '')`, [today]);
        const staffResult = yield database_1.pool.query(`SELECT COUNT(*) FROM staff WHERE is_active = true`);
        const totalChildrenPresent = parseInt(((_a = kidsResult.rows[0]) === null || _a === void 0 ? void 0 : _a.count) || '0', 10);
        const totalStaffPresent = Math.max(parseInt(((_b = staffResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '1', 10), 1);
        const ratioVal = Math.ceil(totalChildrenPresent / totalStaffPresent);
        const currentRatio = `1:${ratioVal > 0 ? ratioVal : 0}`;
        const requiredRatio = "1:8";
        const status = ratioVal <= 8 ? "Compliant" : "Warning";
        res.json({
            totalChildrenPresent,
            totalStaffPresent,
            currentRatio,
            requiredRatio,
            status
        });
    }
    catch (error) {
        console.error('Error fetching daycare ratio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDaycareRatio = getDaycareRatio;
// ─── GET DAYCARE STUDENTS ──────────────────────────────────────────────────────
const getDaycareStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batch } = req.query;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        let query = `
      SELECT s.id, s.first_name, s.last_name, s.admission_number, s.grade, s.profile_image_url,
             COALESCE(p.name, s.emergency_contact_name, 'Parent') AS parent_name,
             COALESCE(p.contact_number, s.emergency_contact_phone, '') AS contact_number,
             s.emergency_contact_name, s.emergency_contact_phone,
             s.medical_notes, s.date_of_birth, s.gender, s.school_id
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE s.is_active = true
    `;
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND s.school_id = $${idx++}`;
            params.push(resolvedSchoolId);
        }
        else if (!isSuper) {
            res.status(200).json({ data: [] });
            return;
        }
        if (batch && batch !== 'all') {
            query += ` AND (LOWER(s.grade) LIKE $${idx} OR LOWER(s.medical_notes) LIKE $${idx})`;
            params.push(`%${batch.toString().toLowerCase()}%`);
            idx++;
        }
        query += ` ORDER BY s.first_name ASC`;
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get daycare students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDaycareStudents = getDaycareStudents;
// ─── GET MONTHLY REPORT (MOCK) ────────────────────────────────────────────────
const getMonthlyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        // Mock report data
        res.json({
            student_id: studentId,
            month: 'June 2026',
            attendance_percentage: 95,
            meals_eaten: 21,
            nap_average_hours: 1.5,
            teacher_notes: 'Sarah has been very active during playtime and finishes all her meals.'
        });
    }
    catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getMonthlyReport = getMonthlyReport;

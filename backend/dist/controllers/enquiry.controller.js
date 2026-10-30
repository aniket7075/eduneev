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
exports.getFollowUpReminders = exports.getConversionAnalytics = exports.getEnquiryStats = exports.convertToAdmission = exports.addFollowUp = exports.deleteEnquiry = exports.updateEnquiry = exports.submitPublicEnquiry = exports.createEnquiry = exports.getEnquiryById = exports.getAllEnquiries = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// ─── GET ALL ENQUIRIES ────────────────────────────────────────────────────────
const getAllEnquiries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, lead_source } = req.query;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if (!isSuper && !resolvedSchoolId) {
            res.status(200).json({ data: [], count: 0 });
            return;
        }
        let query = `
      SELECT e.*,
             sch.name AS school_name,
             u.first_name || ' ' || u.last_name AS assigned_to_name
      FROM enquiries e
      LEFT JOIN users u ON e.assigned_to = u.id
      LEFT JOIN schools sch ON e.school_id = sch.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;
        if (resolvedSchoolId) {
            query += ` AND (e.school_id = $${idx++} OR e.school_id IS NULL)`;
            params.push(resolvedSchoolId);
        }
        if (status && status !== 'all') {
            query += ` AND LOWER(e.status) = LOWER($${idx++})`;
            params.push(status);
        }
        if (lead_source) {
            query += ` AND e.lead_source = $${idx++}`;
            params.push(lead_source);
        }
        query += ' ORDER BY e.created_at DESC';
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows, count: result.rowCount });
    }
    catch (error) {
        console.error('Get enquiries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllEnquiries = getAllEnquiries;
// ─── GET SINGLE ENQUIRY ───────────────────────────────────────────────────────
const getEnquiryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const enquiryResult = yield database_1.pool.query(`SELECT e.*, u.first_name || ' ' || u.last_name AS assigned_to_name
       FROM enquiries e
       LEFT JOIN users u ON e.assigned_to = u.id
       WHERE e.id = $1`, [id]);
        if (enquiryResult.rows.length === 0) {
            res.status(404).json({ error: 'Enquiry not found' });
            return;
        }
        // Fetch follow-ups
        const followUps = yield database_1.pool.query(`SELECT ef.*, u.first_name || ' ' || u.last_name AS done_by_name
       FROM enquiry_follow_ups ef
       LEFT JOIN users u ON ef.done_by = u.id
       WHERE ef.enquiry_id = $1
       ORDER BY ef.created_at DESC`, [id]).catch(() => ({ rows: [] }));
        res.status(200).json({
            data: Object.assign(Object.assign({}, enquiryResult.rows[0]), { follow_ups: followUps.rows }),
        });
    }
    catch (error) {
        console.error('Get enquiry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getEnquiryById = getEnquiryById;
// ─── CREATE ENQUIRY ───────────────────────────────────────────────────────────
const createEnquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { child_name, parent_name, parent_phone, parent_email, child_age, child_dob, class_interested, lead_source, remarks, assigned_to, follow_up_date, school_id, status, } = req.body;
        if (!child_name || !parent_name || !parent_phone) {
            res.status(400).json({ error: 'child_name, parent_name, and parent_phone are required' });
            return;
        }
        // Resolve school_id
        let resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id;
        if (!resolvedSchoolId) {
            const schoolRes = yield database_1.pool.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
            if (schoolRes.rows.length > 0)
                resolvedSchoolId = schoolRes.rows[0].id;
        }
        const result = yield database_1.pool.query(`INSERT INTO enquiries
         (school_id, child_name, student_name, parent_name, parent_phone, phone, parent_email, email,
          child_age, child_dob, class_interested, program_interested, lead_source,
          remarks, notes, assigned_to, follow_up_date, status)
       VALUES ($1,$2,$2,$3,$4,$4,$5,$5,$6,$7,$8,$8,$9,$10,$10,$11,$12,$13)
       RETURNING *`, [
            resolvedSchoolId, child_name, parent_name, parent_phone,
            parent_email || null, child_age || null, child_dob || null,
            class_interested || null, lead_source || 'walk-in',
            remarks || null, assigned_to || null, follow_up_date || null,
            status || 'pending',
        ]);
        res.status(201).json({ message: 'Enquiry created successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create enquiry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createEnquiry = createEnquiry;
// ─── SUBMIT PUBLIC ENQUIRY (UNAUTHENTICATED) ──────────────────────────────────
const submitPublicEnquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { child_name, parent_name, parent_phone, parent_email, child_age, child_dob, class_interested, school_id, lead_source, remarks } = req.body;
        if (!child_name || !parent_name || !parent_phone) {
            res.status(400).json({ error: 'child_name, parent_name, and parent_phone are required' });
            return;
        }
        // Resolve school_id for public forms if not explicitly provided
        let resolvedSchoolId = school_id;
        if (!resolvedSchoolId) {
            const schoolRes = yield database_1.pool.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
            if (schoolRes.rows.length > 0)
                resolvedSchoolId = schoolRes.rows[0].id;
        }
        const safeAge = (child_age && !isNaN(parseInt(child_age))) ? parseInt(child_age) : null;
        const safeDob = (child_dob && typeof child_dob === 'string' && child_dob.trim() !== '') ? child_dob : null;
        const result = yield database_1.pool.query(`INSERT INTO enquiries
         (school_id, child_name, student_name, parent_name, parent_phone, phone, parent_email, email,
          child_age, child_dob, class_interested, program_interested, lead_source, remarks, notes, status)
       VALUES ($1,$2,$2,$3,$4,$4,$5,$5,$6,$7,$8,$8,$9,$10,$10,'new')
       RETURNING *`, [
            resolvedSchoolId, child_name, parent_name, parent_phone,
            parent_email || null, safeAge, safeDob,
            class_interested || null, lead_source || 'QR Code / Website',
            remarks || null
        ]);
        res.status(201).json({ message: 'Enquiry submitted successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Public enquiry submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.submitPublicEnquiry = submitPublicEnquiry;
// ─── UPDATE ENQUIRY ───────────────────────────────────────────────────────────
const updateEnquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { child_name, parent_name, parent_phone, parent_email, child_age, child_dob, class_interested, lead_source, status, remarks, assigned_to, follow_up_date, } = req.body;
        const safeAge = (child_age && !isNaN(parseInt(child_age))) ? parseInt(child_age) : null;
        const safeDob = (child_dob && typeof child_dob === 'string' && child_dob.trim() !== '') ? child_dob : null;
        const safeFollowUp = (follow_up_date && typeof follow_up_date === 'string' && follow_up_date.trim() !== '') ? follow_up_date : null;
        const safeAssignedTo = (assigned_to && typeof assigned_to === 'string' && assigned_to.trim() !== '') ? assigned_to : null;
        const result = yield database_1.pool.query(`UPDATE enquiries SET
         child_name       = COALESCE($1, child_name),
         parent_name      = COALESCE($2, parent_name),
         parent_phone     = COALESCE($3, parent_phone),
         parent_email     = COALESCE($4, parent_email),
         child_age        = COALESCE($5, child_age),
         child_dob        = COALESCE($6, child_dob),
         class_interested = COALESCE($7, class_interested),
         lead_source      = COALESCE($8, lead_source),
         status           = COALESCE($9, status),
         remarks          = COALESCE($10, remarks),
         assigned_to      = COALESCE($11, assigned_to),
         follow_up_date   = COALESCE($12, follow_up_date)
       WHERE id = $13
       RETURNING *`, [
            child_name || null, parent_name || null, parent_phone || null, parent_email || null,
            safeAge, safeDob, class_interested || null, lead_source || null,
            status || null, remarks || null, safeAssignedTo, safeFollowUp, id,
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Enquiry not found' });
            return;
        }
        res.status(200).json({ message: 'Enquiry updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update enquiry error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
exports.updateEnquiry = updateEnquiry;
// ─── DELETE ENQUIRY ───────────────────────────────────────────────────────────
const deleteEnquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query('DELETE FROM enquiries WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Enquiry not found' });
            return;
        }
        res.status(200).json({ message: 'Enquiry deleted successfully' });
    }
    catch (error) {
        console.error('Delete enquiry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteEnquiry = deleteEnquiry;
// ─── ADD FOLLOW-UP ────────────────────────────────────────────────────────────
const addFollowUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params; // enquiry_id
        const { notes, follow_up_date } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!notes) {
            res.status(400).json({ error: 'notes are required' });
            return;
        }
        const enquiryCheck = yield database_1.pool.query('SELECT id FROM enquiries WHERE id = $1', [id]);
        if (enquiryCheck.rows.length === 0) {
            res.status(404).json({ error: 'Enquiry not found' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO enquiry_follow_ups (enquiry_id, notes, follow_up_date, done_by)
       VALUES ($1, $2, $3, $4) RETURNING *`, [id, notes, follow_up_date || null, userId]);
        // Also update the enquiry's follow_up_date if provided
        if (follow_up_date) {
            yield database_1.pool.query(`UPDATE enquiries SET follow_up_date = $1 WHERE id = $2`, [follow_up_date, id]);
        }
        res.status(201).json({ message: 'Follow-up added', data: result.rows[0] });
    }
    catch (error) {
        console.error('Add follow-up error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addFollowUp = addFollowUp;
// ─── CONVERT TO ADMISSION ─────────────────────────────────────────────────────
const convertToAdmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield database_1.pool.connect();
    try {
        const { id } = req.params; // enquiry_id
        const { admission_number, gender, date_of_birth, blood_group, emergency_contact_name, emergency_contact_phone, parent_id, section_id, academic_year_id, school_id, } = req.body;
        if (!admission_number || !gender || !date_of_birth || !parent_id) {
            res.status(400).json({ error: 'Missing required admission fields' });
            return;
        }
        // Fetch enquiry
        const enquiryRes = yield database_1.pool.query('SELECT * FROM enquiries WHERE id = $1', [id]);
        if (enquiryRes.rows.length === 0) {
            res.status(404).json({ error: 'Enquiry not found' });
            return;
        }
        const enquiry = enquiryRes.rows[0];
        yield client.query('BEGIN');
        // Create student
        const studentRes = yield client.query(`INSERT INTO students
         (school_id, parent_id, admission_number, first_name, last_name, gender,
          date_of_birth, blood_group, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`, [
            enquiry.school_id || school_id,
            parent_id,
            admission_number,
            enquiry.child_name.split(' ')[0],
            enquiry.child_name.split(' ').slice(1).join(' ') || '',
            gender,
            date_of_birth,
            blood_group || null,
            emergency_contact_name || enquiry.parent_name,
            emergency_contact_phone || enquiry.parent_phone,
        ]);
        const newStudent = studentRes.rows[0];
        // Assign to section if provided
        if (section_id && academic_year_id) {
            yield client.query(`INSERT INTO student_sections (student_id, section_id, academic_year_id)
         VALUES ($1, $2, $3)`, [newStudent.id, section_id, academic_year_id]);
        }
        // Mark enquiry as enrolled
        yield client.query(`UPDATE enquiries SET status = 'enrolled', converted_student_id = $1 WHERE id = $2`, [newStudent.id, id]);
        yield client.query('COMMIT');
        res.status(201).json({ message: 'Enquiry converted to admission', student: newStudent });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Convert to admission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.convertToAdmission = convertToAdmission;
// ─── GET ENQUIRY STATS ────────────────────────────────────────────────────────
const getEnquiryStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const params = [];
        let where = '';
        if (resolvedSchoolId) {
            where = `WHERE (school_id = $1 OR school_id IS NULL)`;
            params.push(resolvedSchoolId);
        }
        const stats = yield database_1.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(status) IN ('new', 'pending')) AS new_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'contacted')         AS contacted_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'visited')           AS visited_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'enrolled')          AS enrolled_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'lost')              AS lost_count,
        COUNT(*) AS total
      FROM enquiries ${where}
    `, params);
        const sources = yield database_1.pool.query(`
      SELECT COALESCE(lead_source, 'Other') AS lead_source, COUNT(*) AS count
      FROM enquiries ${where}
      GROUP BY lead_source
    `, params);
        res.status(200).json({
            summary: stats.rows[0],
            by_source: sources.rows,
        });
    }
    catch (error) {
        console.error('Get enquiry stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getEnquiryStats = getEnquiryStats;
// ─── GET CONVERSION ANALYTICS ──────────────────────────────────────────────────
const getConversionAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const params = [];
        let where = '';
        if (resolvedSchoolId) {
            where = `WHERE (school_id = $1 OR school_id IS NULL)`;
            params.push(resolvedSchoolId);
        }
        const stats = yield database_1.pool.query(`
      SELECT
        COUNT(*) AS total_leads,
        COUNT(*) FILTER (WHERE LOWER(status) = 'enrolled') AS enrolled_leads,
        COUNT(*) FILTER (WHERE LOWER(status) = 'lost') AS lost_leads
      FROM enquiries ${where}
    `, params);
        const row = stats.rows[0];
        const total = parseInt(row.total_leads, 10) || 0;
        const enrolled = parseInt(row.enrolled_leads, 10) || 0;
        const lost = parseInt(row.lost_leads, 10) || 0;
        const conversion_rate = total > 0 ? ((enrolled / total) * 100).toFixed(2) : '0.00';
        res.status(200).json({
            total_leads: total,
            enrolled_leads: enrolled,
            lost_leads: lost,
            conversion_rate_percentage: conversion_rate
        });
    }
    catch (error) {
        console.error('Get conversion analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getConversionAnalytics = getConversionAnalytics;
// ─── GET FOLLOW-UP REMINDERS ───────────────────────────────────────────────────
const getFollowUpReminders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Fetch all enquiries assigned to this user that have a follow_up_date <= TODAY
        // and are NOT enrolled or lost.
        const result = yield database_1.pool.query(`SELECT e.*, 
              CASE WHEN follow_up_date < CURRENT_DATE THEN 'overdue' ELSE 'today' END AS reminder_status
       FROM enquiries e
       WHERE e.assigned_to = $1 
         AND e.follow_up_date <= CURRENT_DATE
         AND e.status NOT IN ('enrolled', 'lost')
       ORDER BY e.follow_up_date ASC`, [userId]);
        res.status(200).json({ data: result.rows, count: result.rowCount });
    }
    catch (error) {
        console.error('Get follow-up reminders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getFollowUpReminders = getFollowUpReminders;

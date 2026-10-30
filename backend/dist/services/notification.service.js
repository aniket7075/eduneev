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
exports.notifyDaycareActivity = exports.notifyLeaveStatus = exports.notifyNewHomework = exports.notifyAttendanceStatus = exports.getClassParentTokens = exports.getParentTokensForStudent = void 0;
const database_1 = require("../config/database");
const firebase_1 = require("../config/firebase");
/**
 * Service to deliver push notifications to parents and teachers for critical preschool workflows:
 * - Attendance (Punch-in / Punch-out / Absent)
 * - Homework assigned
 * - Leave approved / rejected
 * - Fee reminders
 * - Daycare events
 */
const getParentTokensForStudent = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield database_1.pool.query(`SELECT DISTINCT u.fcm_token 
       FROM users u
       JOIN parents p ON LOWER(p.email) = LOWER(u.email)
       JOIN students s ON s.parent_id = p.id
       WHERE s.id = $1 AND u.fcm_token IS NOT NULL
       UNION
       SELECT DISTINCT u.fcm_token
       FROM users u
       JOIN students s ON (s.parent_id = u.id OR s.id = u.id)
       WHERE s.id = $1 AND u.fcm_token IS NOT NULL`, [studentId]);
        return res.rows.map(r => r.fcm_token).filter(Boolean);
    }
    catch (err) {
        console.error('Error fetching parent FCM tokens for student:', err);
        return [];
    }
});
exports.getParentTokensForStudent = getParentTokensForStudent;
const getClassParentTokens = (grade, schoolId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = `
      SELECT DISTINCT u.fcm_token 
      FROM users u
      JOIN parents p ON LOWER(p.email) = LOWER(u.email)
      JOIN students s ON s.parent_id = p.id
      WHERE s.is_active = true 
        AND LOWER(TRIM(s.grade)) = LOWER(TRIM($1))
        AND u.fcm_token IS NOT NULL
    `;
        const params = [grade];
        if (schoolId) {
            query += ` AND s.school_id = $2`;
            params.push(schoolId);
        }
        const res = yield database_1.pool.query(query, params);
        return res.rows.map(r => r.fcm_token).filter(Boolean);
    }
    catch (err) {
        console.error('Error fetching class parent FCM tokens:', err);
        return [];
    }
});
exports.getClassParentTokens = getClassParentTokens;
/**
 * 1. ATTENDANCE NOTIFICATION
 */
const notifyAttendanceStatus = (studentId, status, inTime, outTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokens = yield (0, exports.getParentTokensForStudent)(studentId);
        if (tokens.length === 0)
            return;
        // Get student name
        const stRes = yield database_1.pool.query(`SELECT first_name, last_name, grade FROM students WHERE id = $1`, [studentId]);
        const student = stRes.rows[0];
        const childName = student ? `${student.first_name} ${student.last_name}`.trim() : 'Your child';
        let title = '🎒 Attendance Update';
        let body = `${childName} was marked ${status} today.`;
        const normStatus = (status || '').toLowerCase();
        if (normStatus === 'present') {
            const timeStr = inTime ? ` at ${inTime}` : '';
            title = '🎒 Safe Arrival at Preschool';
            body = `${childName} has arrived safely at school${timeStr}.`;
        }
        else if (normStatus === 'absent') {
            title = '⚠️ Absence Notice';
            body = `${childName} was marked absent for today's session.`;
        }
        else if (normStatus === 'late') {
            const timeStr = inTime ? ` at ${inTime}` : '';
            title = '⏰ Late Arrival';
            body = `${childName} reached preschool late${timeStr}.`;
        }
        if (outTime) {
            title = '👋 Safe Handover & Departure';
            body = `${childName} has departed safely from preschool at ${outTime}.`;
        }
        yield (0, firebase_1.sendMulticastNotification)(tokens, title, body, {
            type: 'attendance',
            student_id: studentId,
            status: normStatus
        });
    }
    catch (err) {
        console.error('Failed to send attendance push notification:', err);
    }
});
exports.notifyAttendanceStatus = notifyAttendanceStatus;
/**
 * 2. HOMEWORK NOTIFICATION
 */
const notifyNewHomework = (grade, title, dueDate, schoolId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokens = yield (0, exports.getClassParentTokens)(grade, schoolId);
        if (tokens.length === 0)
            return;
        const notifTitle = `📝 New Homework Assigned (${grade})`;
        const notifBody = `${title} — Due date: ${dueDate}. Please check the parent portal.`;
        yield (0, firebase_1.sendMulticastNotification)(tokens, notifTitle, notifBody, {
            type: 'homework',
            grade: grade,
            due_date: dueDate
        });
    }
    catch (err) {
        console.error('Failed to send homework push notification:', err);
    }
});
exports.notifyNewHomework = notifyNewHomework;
/**
 * 3. LEAVE STATUS NOTIFICATION
 */
const notifyLeaveStatus = (leaveId, status) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leaveRes = yield database_1.pool.query(`SELECT la.student_id, la.start_date, la.end_date, s.first_name 
       FROM leave_applications la
       JOIN students s ON la.student_id = s.id
       WHERE la.id = $1`, [leaveId]);
        if (leaveRes.rows.length === 0)
            return;
        const { student_id, first_name, start_date, end_date } = leaveRes.rows[0];
        const tokens = yield (0, exports.getParentTokensForStudent)(student_id);
        if (tokens.length === 0)
            return;
        const title = `📋 Leave Request ${status.toUpperCase()}`;
        const body = `Leave application for ${first_name || 'your child'} (${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}) has been ${status}.`;
        yield (0, firebase_1.sendMulticastNotification)(tokens, title, body, {
            type: 'leave',
            leave_id: leaveId,
            status: status
        });
    }
    catch (err) {
        console.error('Failed to send leave status push notification:', err);
    }
});
exports.notifyLeaveStatus = notifyLeaveStatus;
/**
 * 4. DAYCARE ACTIVITY NOTIFICATION
 */
const notifyDaycareActivity = (studentId, activityType, details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tokens = yield (0, exports.getParentTokensForStudent)(studentId);
        if (tokens.length === 0)
            return;
        const stRes = yield database_1.pool.query(`SELECT first_name FROM students WHERE id = $1`, [studentId]);
        const childName = ((_a = stRes.rows[0]) === null || _a === void 0 ? void 0 : _a.first_name) || 'Your child';
        const title = `🍼 Daycare Update: ${activityType}`;
        const body = `${childName}: ${details}`;
        yield (0, firebase_1.sendMulticastNotification)(tokens, title, body, {
            type: 'daycare',
            student_id: studentId,
            activity: activityType
        });
    }
    catch (err) {
        console.error('Failed to send daycare push notification:', err);
    }
});
exports.notifyDaycareActivity = notifyDaycareActivity;

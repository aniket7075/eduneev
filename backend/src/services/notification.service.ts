import { pool } from '../config/database';
import { sendNotification, sendMulticastNotification } from '../config/firebase';

/**
 * Service to deliver push notifications to parents and teachers for critical preschool workflows:
 * - Attendance (Punch-in / Punch-out / Absent)
 * - Homework assigned
 * - Leave approved / rejected
 * - Fee reminders
 * - Daycare events
 */

export const getParentTokensForStudent = async (studentId: string): Promise<string[]> => {
  try {
    const res = await pool.query(
      `SELECT DISTINCT u.fcm_token 
       FROM users u
       JOIN parents p ON LOWER(p.email) = LOWER(u.email)
       JOIN students s ON s.parent_id = p.id
       WHERE s.id = $1 AND u.fcm_token IS NOT NULL
       UNION
       SELECT DISTINCT u.fcm_token
       FROM users u
       JOIN students s ON (s.parent_id = u.id OR s.id = u.id)
       WHERE s.id = $1 AND u.fcm_token IS NOT NULL`,
      [studentId]
    );

    return res.rows.map(r => r.fcm_token).filter(Boolean);
  } catch (err) {
    console.error('Error fetching parent FCM tokens for student:', err);
    return [];
  }
};

export const getClassParentTokens = async (grade: string, schoolId?: string | null): Promise<string[]> => {
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
    const params: any[] = [grade];

    if (schoolId) {
      query += ` AND s.school_id = $2`;
      params.push(schoolId);
    }

    const res = await pool.query(query, params);
    return res.rows.map(r => r.fcm_token).filter(Boolean);
  } catch (err) {
    console.error('Error fetching class parent FCM tokens:', err);
    return [];
  }
};

/**
 * 1. ATTENDANCE NOTIFICATION
 */
export const notifyAttendanceStatus = async (
  studentId: string, 
  status: string, 
  inTime?: string | null, 
  outTime?: string | null
): Promise<void> => {
  try {
    const tokens = await getParentTokensForStudent(studentId);
    if (tokens.length === 0) return;

    // Get student name
    const stRes = await pool.query(`SELECT first_name, last_name, grade FROM students WHERE id = $1`, [studentId]);
    const student = stRes.rows[0];
    const childName = student ? `${student.first_name} ${student.last_name}`.trim() : 'Your child';

    let title = '🎒 Attendance Update';
    let body = `${childName} was marked ${status} today.`;

    const normStatus = (status || '').toLowerCase();
    if (normStatus === 'present') {
      const timeStr = inTime ? ` at ${inTime}` : '';
      title = '🎒 Safe Arrival at Preschool';
      body = `${childName} has arrived safely at school${timeStr}.`;
    } else if (normStatus === 'absent') {
      title = '⚠️ Absence Notice';
      body = `${childName} was marked absent for today's session.`;
    } else if (normStatus === 'late') {
      const timeStr = inTime ? ` at ${inTime}` : '';
      title = '⏰ Late Arrival';
      body = `${childName} reached preschool late${timeStr}.`;
    }

    if (outTime) {
      title = '👋 Safe Handover & Departure';
      body = `${childName} has departed safely from preschool at ${outTime}.`;
    }

    await sendMulticastNotification(tokens, title, body, {
      type: 'attendance',
      student_id: studentId,
      status: normStatus
    });
  } catch (err) {
    console.error('Failed to send attendance push notification:', err);
  }
};

/**
 * 2. HOMEWORK NOTIFICATION
 */
export const notifyNewHomework = async (
  grade: string, 
  title: string, 
  dueDate: string, 
  schoolId?: string | null
): Promise<void> => {
  try {
    const tokens = await getClassParentTokens(grade, schoolId);
    if (tokens.length === 0) return;

    const notifTitle = `📝 New Homework Assigned (${grade})`;
    const notifBody = `${title} — Due date: ${dueDate}. Please check the parent portal.`;

    await sendMulticastNotification(tokens, notifTitle, notifBody, {
      type: 'homework',
      grade: grade,
      due_date: dueDate
    });
  } catch (err) {
    console.error('Failed to send homework push notification:', err);
  }
};

/**
 * 3. LEAVE STATUS NOTIFICATION
 */
export const notifyLeaveStatus = async (
  leaveId: string, 
  status: string
): Promise<void> => {
  try {
    const leaveRes = await pool.query(
      `SELECT la.student_id, la.start_date, la.end_date, s.first_name 
       FROM leave_applications la
       JOIN students s ON la.student_id = s.id
       WHERE la.id = $1`,
      [leaveId]
    );
    if (leaveRes.rows.length === 0) return;

    const { student_id, first_name, start_date, end_date } = leaveRes.rows[0];
    const tokens = await getParentTokensForStudent(student_id);
    if (tokens.length === 0) return;

    const title = `📋 Leave Request ${status.toUpperCase()}`;
    const body = `Leave application for ${first_name || 'your child'} (${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}) has been ${status}.`;

    await sendMulticastNotification(tokens, title, body, {
      type: 'leave',
      leave_id: leaveId,
      status: status
    });
  } catch (err) {
    console.error('Failed to send leave status push notification:', err);
  }
};

/**
 * 4. DAYCARE ACTIVITY NOTIFICATION
 */
export const notifyDaycareActivity = async (
  studentId: string,
  activityType: string,
  details: string
): Promise<void> => {
  try {
    const tokens = await getParentTokensForStudent(studentId);
    if (tokens.length === 0) return;

    const stRes = await pool.query(`SELECT first_name FROM students WHERE id = $1`, [studentId]);
    const childName = stRes.rows[0]?.first_name || 'Your child';

    const title = `🍼 Daycare Update: ${activityType}`;
    const body = `${childName}: ${details}`;

    await sendMulticastNotification(tokens, title, body, {
      type: 'daycare',
      student_id: studentId,
      activity: activityType
    });
  } catch (err) {
    console.error('Failed to send daycare push notification:', err);
  }
};


import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId } from '../middlewares/auth.middleware';

/**
 * Resolves the target student ID either directly or via parent relation.
 */
const resolveStudentId = async (inputParamId: string, userId?: string, email?: string): Promise<{ studentId: string; schoolId?: string } | null> => {
  // 1. Direct student match
  const directRes = await pool.query(
    `SELECT id, school_id FROM students WHERE id::text = $1 LIMIT 1`,
    [inputParamId]
  ).catch(() => ({ rows: [] }));

  if (directRes.rows.length > 0) {
    return { studentId: directRes.rows[0].id, schoolId: directRes.rows[0].school_id };
  }

  // 2. Lookup via parent ID or parent email
  const parentChildRes = await pool.query(
    `SELECT s.id, s.school_id 
     FROM students s
     LEFT JOIN parents p ON s.parent_id = p.id
     WHERE s.parent_id::text = $1 
        OR (p.email IS NOT NULL AND LOWER(p.email) = LOWER($2))
        OR s.parent_id::text = $3
     ORDER BY s.created_at ASC
     LIMIT 1`,
    [inputParamId, email || '', userId || '']
  ).catch(() => ({ rows: [] }));

  if (parentChildRes.rows.length > 0) {
    return { studentId: parentChildRes.rows[0].id, schoolId: parentChildRes.rows[0].school_id };
  }

  return null;
};

export const getHealthRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentIdParam = (Array.isArray(req.params.student_id) ? req.params.student_id[0] : req.params.student_id) || '';
    let resolved = await resolveStudentId(studentIdParam, req.user?.id, req.user?.email);

    if (!resolved) {
      // Fallback: Check if there's any student matching the logged user's child
      const userEmail = req.user?.email || '';
      const fallbackStudent = await pool.query(
        `SELECT s.id, s.school_id FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE LOWER(p.email) = LOWER($1) OR s.parent_id::text = $2
         LIMIT 1`,
        [userEmail, req.user?.id || '']
      ).catch(() => ({ rows: [] }));

      if (fallbackStudent.rows.length === 0) {
        res.status(200).json({ data: null, sick_reports: [], checkups: [] });
        return;
      }
      resolved = {
        studentId: fallbackStudent.rows[0].id,
        schoolId: fallbackStudent.rows[0].school_id,
      };
    }

    const targetStudentId = resolved.studentId;

    // 1. Fetch Student profile & health record
    const healthRes = await pool.query(
      `SELECT 
          s.id as student_id,
          s.first_name,
          s.last_name,
          s.grade,
          s.school_id,
          COALESCE(hr.blood_group::text, s.blood_group::text, 'O +ve') as blood_group,
          COALESCE(hr.allergies, 'None reported') as allergies,
          hr.height,
          hr.weight,
          hr.last_checkup_date,
          hr.id as health_record_id,
          hr.created_at
       FROM students s
       LEFT JOIN health_records hr ON hr.student_id = s.id
       WHERE s.id::text = $1::text
       LIMIT 1`,
      [targetStudentId]
    );

    const studentHealth = healthRes.rows[0] || null;

    // 2. Fetch Real-time Sick Reports
    const sickReportsRes = await pool.query(
      `SELECT 
          id,
          illness_type as "illnessType",
          to_char(start_date, 'YYYY-MM-DD') as "startDate",
          rest_days as "restDays",
          symptoms,
          requested_callback as "requestedCallback",
          status,
          to_char(created_at, 'YYYY-MM-DD HH12:MI AM') as "createdAt"
       FROM student_sick_reports 
       WHERE student_id = $1 
       ORDER BY created_at DESC`,
      [targetStudentId]
    );

    // 3. Fetch Real-time Medical Checkups
    const checkupsRes = await pool.query(
      `SELECT 
          id,
          to_char(checkup_date, 'DD Mon YYYY') as checkup_date_formatted,
          to_char(checkup_date, 'YYYY-MM-DD') as checkup_date,
          doctor_name,
          doctor_remarks,
          status,
          created_at
       FROM student_medical_checkups 
       WHERE student_id = $1 
       ORDER BY checkup_date DESC, created_at DESC`,
      [targetStudentId]
    );

    res.status(200).json({
      data: studentHealth,
      sick_reports: sickReportsRes.rows,
      checkups: checkupsRes.rows
    });
  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSickReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, illnessType, startDate, restDays, symptoms, requestedCallback } = req.body;
    
    // Resolve student
    let targetStudentId = student_id;
    if (!targetStudentId) {
      const resolved = await resolveStudentId(req.user?.id || '', req.user?.id, req.user?.email);
      targetStudentId = resolved?.studentId;
    }

    if (!targetStudentId) {
      res.status(400).json({ error: 'Student ID could not be identified' });
      return;
    }

    // Get school_id
    const studentInfo = await pool.query(`SELECT school_id FROM students WHERE id = $1 LIMIT 1`, [targetStudentId]);
    const schoolId = studentInfo.rows[0]?.school_id || getTenantSchoolId(req);

    const insertRes = await pool.query(
      `INSERT INTO student_sick_reports 
       (student_id, school_id, illness_type, start_date, rest_days, symptoms, requested_callback, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'School Notified')
       RETURNING 
          id,
          illness_type as "illnessType",
          to_char(start_date, 'YYYY-MM-DD') as "startDate",
          rest_days as "restDays",
          symptoms,
          requested_callback as "requestedCallback",
          status,
          to_char(created_at, 'YYYY-MM-DD HH12:MI AM') as "createdAt"`,
      [
        targetStudentId,
        schoolId,
        illnessType || 'Fever / Unwell',
        startDate || new Date().toISOString().split('T')[0],
        restDays || '1 to 2 Days',
        symptoms || 'Parent notified child is unwell and resting.',
        !!requestedCallback
      ]
    );

    res.status(201).json({
      message: 'Sick report submitted in real time',
      data: insertRes.rows[0]
    });
  } catch (error) {
    console.error('Create sick report error:', error);
    res.status(500).json({ error: 'Failed to record sick update' });
  }
};

export const updateSickReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE student_sick_reports 
       SET status = $1 
       WHERE id = $2 
       RETURNING id, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Sick report not found' });
      return;
    }

    res.status(200).json({ message: 'Sick report status updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update sick report status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMedicalCheckup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const { checkup_date, doctor_name, doctor_remarks, status } = req.body;

    const studentInfo = await pool.query(`SELECT school_id FROM students WHERE id = $1 LIMIT 1`, [student_id]);
    const schoolId = studentInfo.rows[0]?.school_id || getTenantSchoolId(req);

    const result = await pool.query(
      `INSERT INTO student_medical_checkups (student_id, school_id, checkup_date, doctor_name, doctor_remarks, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
          id,
          to_char(checkup_date, 'DD Mon YYYY') as checkup_date_formatted,
          to_char(checkup_date, 'YYYY-MM-DD') as checkup_date,
          doctor_name,
          doctor_remarks,
          status`,
      [
        student_id,
        schoolId,
        checkup_date || new Date().toISOString().split('T')[0],
        doctor_name || 'Dr. School Pediatrician',
        doctor_remarks || 'Annual health and wellness checkup clear.',
        status || 'Fit & Healthy'
      ]
    );

    // Also update last_checkup_date on health_records
    await pool.query(
      `UPDATE health_records SET last_checkup_date = $1 WHERE student_id = $2`,
      [checkup_date || new Date().toISOString().split('T')[0], student_id]
    ).catch(() => null);

    res.status(201).json({ message: 'Medical checkup logged', data: result.rows[0] });
  } catch (error) {
    console.error('Add medical checkup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const upsertHealthRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const { blood_group, allergies, height, weight, last_checkup_date } = req.body;
    
    // Check school_id
    const studentInfo = await pool.query(`SELECT school_id FROM students WHERE id = $1 LIMIT 1`, [student_id]);
    const schoolId = studentInfo.rows[0]?.school_id || getTenantSchoolId(req);

    // Update students table blood_group as well if provided
    if (blood_group) {
      await pool.query(`UPDATE students SET blood_group = $1 WHERE id = $2`, [blood_group, student_id]).catch(() => null);
    }

    const existing = await pool.query(`SELECT id FROM health_records WHERE student_id = $1 LIMIT 1`, [student_id]);
    
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE health_records 
         SET blood_group = COALESCE($1, blood_group), 
             allergies = COALESCE($2, allergies), 
             height = COALESCE($3, height), 
             weight = COALESCE($4, weight), 
             last_checkup_date = COALESCE($5, last_checkup_date)
         WHERE student_id = $6`,
        [blood_group, allergies, height ? parseFloat(height) : null, weight ? parseFloat(weight) : null, last_checkup_date || null, student_id]
      );
    } else {
      await pool.query(
        `INSERT INTO health_records (student_id, school_id, blood_group, allergies, height, weight, last_checkup_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [student_id, schoolId, blood_group, allergies || 'None reported', height ? parseFloat(height) : null, weight ? parseFloat(weight) : null, last_checkup_date || null]
      );
    }
    
    res.status(200).json({ message: 'Health record saved successfully' });
  } catch (error) {
    console.error('Upsert health record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHealthRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    
    await pool.query(`DELETE FROM health_records WHERE student_id = $1`, [student_id]);
    res.status(200).json({ message: 'Health record deleted successfully' });
  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

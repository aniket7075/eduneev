import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

// ─── GET ALL DAYCARE LOGS FOR A CLASS / DATE ──────────────────────────────────
export const getDaycareLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, student_id } = req.query;
    const resolvedSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

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
    const params: any[] = [];
    let idx = 1;

    if (student_id)       { query += ` AND dl.student_id = $${idx++}`; params.push(student_id); }
    if (date)             { query += ` AND dl.date = $${idx++}`;        params.push(date); }
    if (resolvedSchoolId) { query += ` AND s.school_id = $${idx++}`; params.push(resolvedSchoolId); }

    query += ' ORDER BY dl.date DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get daycare logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET SINGLE DAYCARE LOG ───────────────────────────────────────────────────
export const getDaycareLogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT dl.*,
              s.first_name || ' ' || s.last_name AS student_name,
              s.profile_image_url AS photo_url
       FROM daycare_logs dl
       JOIN students s ON dl.student_id = s.id
       WHERE dl.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Daycare log not found' });
      return;
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Get daycare log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE DAYCARE LOG ───────────────────────────────────────────────────────
export const createDaycareLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      student_id, date, activity_type, check_in_time, check_out_time,
      meals, nap_start, nap_end, mood, water_intake,
      washroom_visits, learning_activity, teacher_notes, parent_visible,
      nap_quality, diaper_status, health_status, energy_level,
      temperature, medicine_given, medicine_note, activity_tags,
      snacks_notes, parent_message,
    } = req.body;
    const userId = req.user?.id;

    if (!student_id || !date) {
      res.status(400).json({ error: 'student_id and date are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO daycare_logs
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
       RETURNING *`,
      [
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
      ]
    );

    res.status(201).json({ message: 'Daycare log saved', data: result.rows[0] });
  } catch (error) {
    console.error('Create daycare log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// ─── UPDATE DAYCARE LOG ───────────────────────────────────────────────────────
export const updateDaycareLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      check_in_time, check_out_time, meals, nap_start, nap_end,
      mood, water_intake, washroom_visits, learning_activity,
      teacher_notes, parent_visible,
    } = req.body;

    const result = await pool.query(
      `UPDATE daycare_logs SET
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
       RETURNING *`,
      [
        check_in_time, check_out_time,
        meals ? JSON.stringify(meals) : null,
        nap_start, nap_end, mood, water_intake,
        washroom_visits, learning_activity,
        teacher_notes, parent_visible, id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Daycare log not found' });
      return;
    }
    res.status(200).json({ message: 'Daycare log updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update daycare log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE DAYCARE LOG ───────────────────────────────────────────────────────
export const deleteDaycareLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM daycare_logs WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Daycare log not found' });
      return;
    }
    res.status(200).json({ message: 'Daycare log deleted' });
  } catch (error) {
    console.error('Delete daycare log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── BULK LOG FOR ENTIRE CLASS ────────────────────────────────────────────────
export const bulkCreateDaycareLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { date, logs } = req.body; // logs = [{ student_id, mood, meals, ... }]
    const userId = req.user?.id;

    if (!date || !Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({ error: 'date and logs[] are required' });
      return;
    }

    await client.query('BEGIN');

    for (const log of logs) {
      await client.query(
        `INSERT INTO daycare_logs
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
           logged_by = EXCLUDED.logged_by`,
        [
          log.student_id, date,
          log.meals ? JSON.stringify(log.meals) : '{}',
          log.mood || null, log.water_intake || null,
          log.washroom_visits || 0,
          log.learning_activity || null, log.teacher_notes || log.notes || null,
          log.check_in_time || null, log.check_out_time || null,
          userId,
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `Daycare logged for ${logs.length} student(s)` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk daycare log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ─── GET DAYCARE SCHEDULES ────────────────────────────────────────────────────
export const getDaycareSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.query;
    let query = `SELECT * FROM daycare_schedules WHERE is_active = true`;
    const params: any[] = [];
    if (school_id) { query += ` AND school_id = $1`; params.push(school_id); }
    query += ' ORDER BY schedule_time ASC';

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── CREATE DAYCARE SCHEDULE ──────────────────────────────────────────────────
export const createDaycareSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, schedule_time, days_of_week, school_id } = req.body;
    if (!title || !schedule_time) {
      res.status(400).json({ error: 'title and schedule_time are required' });
      return;
    }

    let resolvedSchoolId = school_id;
    if (!resolvedSchoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) resolvedSchoolId = s.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO daycare_schedules (school_id, title, description, schedule_time, days_of_week)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [resolvedSchoolId, title, description || null, schedule_time, days_of_week || [1,2,3,4,5]]
    );
    res.status(201).json({ message: 'Schedule created', data: result.rows[0] });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE DAYCARE SCHEDULE ──────────────────────────────────────────────────
export const deleteDaycareSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE daycare_schedules SET is_active = false WHERE id = $1', [id]);
    res.status(200).json({ message: 'Schedule removed' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// ─── GET DAYCARE RATIO (REAL DB COUNT) ───────────────────────────────────────
export const getDaycareRatio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const kidsResult = await pool.query(
      `SELECT COUNT(DISTINCT student_id) FROM daycare_logs WHERE date = $1 AND check_in_time IS NOT NULL AND (check_out_time IS NULL OR check_out_time = '')`,
      [today]
    );

    const staffResult = await pool.query(
      `SELECT COUNT(*) FROM staff WHERE is_active = true`
    );

    const totalChildrenPresent = parseInt(kidsResult.rows[0]?.count || '0', 10);
    const totalStaffPresent = Math.max(parseInt(staffResult.rows[0]?.count || '1', 10), 1);

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
  } catch (error) {
    console.error('Error fetching daycare ratio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET DAYCARE STUDENTS ──────────────────────────────────────────────────────
export const getDaycareStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch } = req.query;
    const resolvedSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

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
    const params: any[] = [];
    let idx = 1;

    if (resolvedSchoolId) {
      query += ` AND s.school_id = $${idx++}`;
      params.push(resolvedSchoolId);
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    if (batch && batch !== 'all') {
      query += ` AND (LOWER(s.grade) LIKE $${idx} OR LOWER(s.medical_notes) LIKE $${idx})`;
      params.push(`%${batch.toString().toLowerCase()}%`);
      idx++;
    }

    query += ` ORDER BY s.first_name ASC`;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get daycare students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET MONTHLY REPORT (MOCK) ────────────────────────────────────────────────
export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

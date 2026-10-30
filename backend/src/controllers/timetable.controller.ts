import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

export const getTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade } = req.params;
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    let query = `SELECT * FROM timetables WHERE LOWER(grade) = LOWER($1)`;
    const params: any[] = [grade];

    if (tenantSchoolId) {
      query += ` AND (school_id = $2 OR school_id IS NULL)`;
      params.push(tenantSchoolId);
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    query += ` ORDER BY day_of_week, period_number ASC`;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade, day_of_week, period_number, subject, start_time, end_time } = req.body;
    const tenantSchoolId = getTenantSchoolId(req);
    
    const role = req.user?.role;
    if (role === 'parent') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO timetables (grade, day_of_week, period_number, subject, start_time, end_time, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [grade, day_of_week, period_number, subject, start_time, end_time, tenantSchoolId]
    );

    res.status(201).json({ message: 'Timetable entry created', data: result.rows[0] });
  } catch (error) {
    console.error('Create timetable entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { grade, day_of_week, period_number, subject, start_time, end_time } = req.body;
  const tenantSchoolId = getTenantSchoolId(req);
  const isSuper = isSuperAdminUser(req);

  if (!grade || !day_of_week || !period_number || !subject || !start_time || !end_time) {
    res.status(400).json({ error: 'Missing required timetable fields' });
    return;
  }
  try {
    let updateQuery = `UPDATE timetables 
       SET grade = $1, day_of_week = $2, period_number = $3, subject = $4, start_time = $5, end_time = $6
       WHERE id = $7`;
    const params: any[] = [grade, day_of_week, parseInt(period_number), subject, start_time, end_time, id];

    if (!isSuper && tenantSchoolId) {
      updateQuery += ` AND school_id = $8`;
      params.push(tenantSchoolId);
    }
    updateQuery += ` RETURNING *`;

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Timetable entry not found or belongs to another branch' });
      return;
    }
    res.json({ message: 'Timetable entry updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update timetable entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const tenantSchoolId = getTenantSchoolId(req);
  const isSuper = isSuperAdminUser(req);

  try {
    let deleteQuery = `DELETE FROM timetables WHERE id = $1`;
    const params: any[] = [id];

    if (!isSuper && tenantSchoolId) {
      deleteQuery += ` AND school_id = $2`;
      params.push(tenantSchoolId);
    }
    deleteQuery += ` RETURNING id`;

    const result = await pool.query(deleteQuery, params);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Timetable entry not found or belongs to another branch' });
      return;
    }
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Delete timetable entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Teacher subjects CRUD

export const getTeacherSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade } = req.params;
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    let query = `
      SELECT ts.*, u.first_name, u.last_name 
      FROM teacher_subjects ts
      JOIN staff_profiles sp ON ts.teacher_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE ts.grade = $1
    `;
    const params: any[] = [grade];

    if (tenantSchoolId) {
      query += ` AND (ts.school_id = $2 OR sp.school_id = $2 OR u.school_id = $2)`;
      params.push(tenantSchoolId);
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get teacher subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addTeacherSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacher_id, grade, subject, weekly_periods } = req.body;
    const tenantSchoolId = getTenantSchoolId(req);
    
    if (!teacher_id || !grade || !subject) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO teacher_subjects (teacher_id, grade, subject, weekly_periods, school_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [teacher_id, grade, subject, weekly_periods || 5, tenantSchoolId]
    );

    res.status(201).json({ message: 'Teacher subject mapping created', data: result.rows[0] });
  } catch (error: any) {
    console.error('Add teacher subject error:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'This teacher is already assigned to this subject and grade' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteTeacherSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const tenantSchoolId = getTenantSchoolId(req);
  const isSuper = isSuperAdminUser(req);

  try {
    let deleteQuery = `DELETE FROM teacher_subjects WHERE id = $1`;
    const params: any[] = [id];

    if (!isSuper && tenantSchoolId) {
      deleteQuery += ` AND school_id = $2`;
      params.push(tenantSchoolId);
    }
    deleteQuery += ` RETURNING id`;

    const result = await pool.query(deleteQuery, params);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Teacher subject mapping not found or belongs to another branch' });
      return;
    }
    res.json({ message: 'Teacher subject mapping deleted successfully' });
  } catch (error) {
    console.error('Delete teacher subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Timetable Auto-Generator

export const generateTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { target_grades, period_timings } = req.body;
    const tenantSchoolId = getTenantSchoolId(req);

    if (!target_grades || !Array.isArray(target_grades) || target_grades.length === 0) {
      res.status(400).json({ error: 'target_grades array is required' });
      return;
    }
    
    await pool.query('BEGIN');
    
    // 1. Delete old timetable for target grades strictly for this school
    let delQuery = `DELETE FROM timetables WHERE grade = ANY($1)`;
    const delParams: any[] = [target_grades];
    if (tenantSchoolId) {
      delQuery += ` AND school_id = $2`;
      delParams.push(tenantSchoolId);
    }
    await pool.query(delQuery, delParams);

    // 2. Fetch all teacher subjects for these grades
    let tsQuery = `SELECT * FROM teacher_subjects WHERE grade = ANY($1)`;
    const tsParams: any[] = [target_grades];
    if (tenantSchoolId) {
      tsQuery += ` AND school_id = $2`;
      tsParams.push(tenantSchoolId);
    }
    tsQuery += ` ORDER BY weekly_periods DESC`;

    const tsResult = await pool.query(tsQuery, tsParams);
    const teacherSubjects = tsResult.rows;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const defaultTimings = [
      { period_number: 1, start_time: '08:30 AM', end_time: '09:15 AM' },
      { period_number: 2, start_time: '09:15 AM', end_time: '10:00 AM' },
      { period_number: 3, start_time: '10:00 AM', end_time: '10:45 AM' },
      { period_number: 4, start_time: '11:00 AM', end_time: '11:45 AM' },
      { period_number: 5, start_time: '11:45 AM', end_time: '12:30 PM' },
    ];
    
    const timings = period_timings && period_timings.length > 0 ? period_timings : defaultTimings;
    
    const teacherBooked = new Map<string, Set<string>>();
    const getTeacherBooked = (tid: string) => {
      if (!teacherBooked.has(tid)) teacherBooked.set(tid, new Set<string>());
      return teacherBooked.get(tid)!;
    };

    const newEntries: any[] = [];

    for (const grade of target_grades) {
      const subjectsForGrade = teacherSubjects.filter(ts => ts.grade === grade);
      
      for (const ts of subjectsForGrade) {
        let placed = 0;
        let attempts = 0;
        
        while (placed < ts.weekly_periods && attempts < 100) {
          attempts++;
          const randomDay = days[Math.floor(Math.random() * days.length)];
          const randomPeriod = timings[Math.floor(Math.random() * timings.length)];
          const timeSlotKey = `${randomDay}_${randomPeriod.period_number}`;
          
          const gradeSlotTaken = newEntries.some(e => e.grade === grade && e.day_of_week === randomDay && e.period_number === randomPeriod.period_number);
          const tBooked = getTeacherBooked(ts.teacher_id);
          const teacherSlotTaken = tBooked.has(timeSlotKey);
          
          if (!gradeSlotTaken && !teacherSlotTaken) {
            newEntries.push({
              grade,
              day_of_week: randomDay,
              period_number: randomPeriod.period_number,
              subject: ts.subject,
              start_time: randomPeriod.start_time,
              end_time: randomPeriod.end_time,
              teacher_id: ts.teacher_id
            });
            
            tBooked.add(timeSlotKey);
            placed++;
          }
        }
      }
    }
    
    // Save to DB with school_id
    for (const entry of newEntries) {
      await pool.query(
        `INSERT INTO timetables (grade, day_of_week, period_number, subject, start_time, end_time, teacher_id, school_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [entry.grade, entry.day_of_week, entry.period_number, entry.subject, entry.start_time, entry.end_time, entry.teacher_id, tenantSchoolId]
      );
    }
    
    await pool.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Timetable generated successfully', 
      total_entries: newEntries.length 
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Generate timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

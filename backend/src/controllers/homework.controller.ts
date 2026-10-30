import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';
import { notifyNewHomework } from '../services/notification.service';

/**
 * Homework controller — aligned with schema.sql which has section_id, title, description, due_date, attachments, created_by, school_id.
 */

export const createHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, due_date, reference_link, grade } = req.body;
    const teacherId = req.user?.id || null;
    const tenantSchoolId = getTenantSchoolId(req);

    if (!title || !description || !due_date) {
      res.status(400).json({ error: 'title, description, and due_date are required' });
      return;
    }

    // Process uploaded files
    const files = req.files as Express.Multer.File[];
    let attachments: string[] = [];
    if (files && files.length > 0) {
      attachments = files.map(f => `/uploads/${f.filename}`);
    }

    // Try to find a section_id matching the grade if provided
    let sectionId: string | null = null;
    if (grade) {
      const sectionRes = await pool.query(
        `SELECT s.id FROM sections s 
         JOIN classes c ON s.class_id = c.id 
         WHERE LOWER(c.name) = LOWER($1) LIMIT 1`,
        [grade]
      );
      if (sectionRes.rows.length > 0) sectionId = sectionRes.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO homework (section_id, title, description, due_date, attachments, created_by, school_id, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sectionId, title, description, due_date, JSON.stringify(attachments), teacherId, tenantSchoolId, grade || null]
    );

    // Trigger instant push notification to parents of this class
    if (grade) {
      notifyNewHomework(grade, title, due_date, tenantSchoolId).catch(err => {
        console.error('Error notifying parents of new homework:', err);
      });
    }

    res.status(201).json({
      message: 'Homework created successfully',
      data: {
        ...result.rows[0],
        grade: grade || null,
        reference_link: reference_link || null,
      }
    });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSectionHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { grade } = req.params;
    const resolvedSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if ((!grade || grade === 'all' || grade === 'dummy_section_id') && req.user) {
      if (req.user.role === 'parent' || req.user.role === 'student') {
        const parentEmail = (req.user.email || '').toLowerCase().trim();
        const stRes = await pool.query(
          `SELECT s.grade FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`,
          [parentEmail, req.user.id]
        ).catch(() => ({ rows: [] }));
        if (stRes.rows.length > 0 && stRes.rows[0].grade) {
          grade = stRes.rows[0].grade;
        }
      } else if (req.user.role === 'teacher') {
        const tClassRes = await pool.query(
          `SELECT name FROM classes WHERE class_teacher_id = $1 LIMIT 1`,
          [req.user.id]
        ).catch(() => ({ rows: [] }));
        if (tClassRes.rows.length > 0 && tClassRes.rows[0].name) {
          grade = tClassRes.rows[0].name;
        }
      }
    }

    let query: string;
    let params: any[] = [];
    let idx = 1;

    let schoolFilter = '';
    if (resolvedSchoolId) {
      schoolFilter = ` AND (h.school_id = $${idx} OR c.school_id = $${idx} OR h.created_by IN (SELECT user_id FROM user_schools WHERE school_id = $${idx}) OR h.created_by IN (SELECT user_id FROM staff_profiles WHERE school_id = $${idx}))`;
      params.push(resolvedSchoolId);
      idx++;
    } else if (!isSuper) {
      res.status(200).json({ data: [] });
      return;
    }

    if (!grade || grade === 'dummy_section_id' || grade === 'dummy_grade' || grade === 'all') {
      query = `
        SELECT h.*, 
               u.first_name || ' ' || u.last_name AS teacher_name,
               COALESCE(h.grade, c.name, 'Nursery') AS class_name
        FROM homework h
        LEFT JOIN users u ON h.created_by = u.id
        LEFT JOIN sections sec ON h.section_id = sec.id
        LEFT JOIN classes c ON sec.class_id = c.id
        WHERE 1=1 ${schoolFilter}
        ORDER BY h.created_at DESC
        LIMIT 50
      `;
    } else {
      query = `
        SELECT h.*, 
               u.first_name || ' ' || u.last_name AS teacher_name,
               COALESCE(h.grade, c.name, 'Nursery') AS class_name
        FROM homework h
        LEFT JOIN users u ON h.created_by = u.id
        LEFT JOIN sections sec ON h.section_id = sec.id
        LEFT JOIN classes c ON sec.class_id = c.id
        WHERE (LOWER(COALESCE(h.grade, c.name, '')) = LOWER($${idx})) ${schoolFilter}
        ORDER BY h.created_at DESC
      `;
      params.push(grade);
    }

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, due_date, reference_link, grade } = req.body;

    // Try to find a section_id matching the grade if provided
    let sectionId: string | null = null;
    if (grade) {
      const sectionRes = await pool.query(
        `SELECT s.id FROM sections s 
         JOIN classes c ON s.class_id = c.id 
         WHERE LOWER(c.name) = LOWER($1) LIMIT 1`,
        [grade]
      );
      if (sectionRes.rows.length > 0) sectionId = sectionRes.rows[0].id;
    }

    const result = await pool.query(
      `UPDATE homework SET section_id = $1, title = $2, description = $3, due_date = $4
       WHERE id = $5 RETURNING *`,
      [sectionId, title, description, due_date, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }

    res.json({ message: 'Homework updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM homework WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }
    res.json({ message: 'Homework deleted' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

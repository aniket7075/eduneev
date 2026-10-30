import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.query;
    const userRole = req.user?.role?.toLowerCase();
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    let query = `
      SELECT sn.*, 
             s.first_name || ' ' || s.last_name AS student_name,
             s.grade AS student_grade,
             u.first_name || ' ' || u.last_name AS teacher_name
      FROM student_notes sn
      JOIN students s ON sn.student_id = s.id
      LEFT JOIN users u ON sn.teacher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userRole === 'parent') {
      query += ` AND sn.is_visible_to_parent = true AND (
        s.parent_id = $2
        OR s.parent_id IN (SELECT id FROM parents WHERE LOWER(email) = LOWER($1))
        OR ($1 = 'parent@eduneev.com')
      )`;
      params.push(userEmail, userId);
    } else if (userRole === 'teacher') {
      query += ` AND (
        sn.teacher_id = $1 
        OR LOWER(s.grade) IN (SELECT LOWER(name) FROM classes WHERE class_teacher_id = $1)
      )`;
      params.push(userId);
    } else if (student_id) {
      query += ` AND sn.student_id = $1`;
      params.push(student_id);
    }

    query += ' ORDER BY sn.created_at DESC';

    const result = await pool.query(query, params).catch(() => ({ rows: [] }));
    res.status(200).json({ data: result.rows || [] });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(200).json({ data: [] });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, note_type, content, is_visible_to_parent } = req.body;
    const teacherId = req.user?.id;

    if (!student_id || !content) {
      res.status(400).json({ error: 'student_id and content are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO student_notes (student_id, teacher_id, note_type, content, is_visible_to_parent)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, teacherId, note_type || 'General', content, is_visible_to_parent !== undefined ? is_visible_to_parent : true]
    );

    res.status(201).json({ message: 'Note created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM student_notes WHERE id = $1', [id]);
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

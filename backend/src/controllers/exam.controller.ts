import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { term, name, grade, year } = req.body;
    const role = req.user?.role;
    
    if (role === 'parent') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO exams (term, name, grade, year) VALUES ($1, $2, $3, $4) RETURNING *`,
      [term, name, grade, year]
    );

    res.status(201).json({ message: 'Exam created', data: result.rows[0] });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade } = req.params;
    const result = await pool.query(`SELECT * FROM exams WHERE grade = $1 ORDER BY created_at DESC`, [grade]);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enterMarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exam_id, student_id, subject, marks_obtained, max_marks } = req.body;
    const role = req.user?.role;
    
    if (role === 'parent') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO exam_marks (exam_id, student_id, subject, marks_obtained, max_marks) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (exam_id, student_id, subject) 
       DO UPDATE SET marks_obtained = $4, max_marks = $5 
       RETURNING *`,
      [exam_id, student_id, subject, marks_obtained, max_marks]
    );

    res.status(200).json({ message: 'Marks updated', data: result.rows[0] });
  } catch (error) {
    console.error('Enter marks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReportCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    
    // Fetch all marks for this student, joined with exam info
    const query = `
      SELECT em.*, e.term, e.name as exam_name, e.year 
      FROM exam_marks em
      JOIN exams e ON em.exam_id = e.id
      WHERE em.student_id = $1
      ORDER BY e.term ASC, e.created_at ASC
    `;
    
    const result = await pool.query(query, [student_id]);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get report card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

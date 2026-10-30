import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

// Add an exam
export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { schoolId, sectionId, name, examDate, totalMarks } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO exams (school_id, section_id, name, exam_date, total_marks)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [schoolId, sectionId, name, examDate, totalMarks]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add results for an exam
export const addResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { examId, results } = req.body; 
  // results = [{ studentId, marksObtained, grade, remarks }]
  try {
    // using transaction if possible or bulk insert
    await pool.query('BEGIN');
    for (const r of results) {
      await pool.query(
        `INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id, student_id) DO UPDATE 
         SET marks_obtained = EXCLUDED.marks_obtained, grade = EXCLUDED.grade, remarks = EXCLUDED.remarks`,
        [examId, r.studentId, r.marksObtained, r.grade, r.remarks]
      );
    }
    await pool.query('COMMIT');
    res.json({ message: 'Results saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// View results for a student
export const getStudentResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.marks_obtained, r.grade, r.remarks, e.name as exam_name, e.exam_date, e.total_marks
       FROM exam_results r
       JOIN exams e ON r.exam_id = e.id
       WHERE r.student_id = $1
       ORDER BY e.exam_date DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

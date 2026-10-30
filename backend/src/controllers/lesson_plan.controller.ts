import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getLessonPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade } = req.params;
    const result = await pool.query(
      `SELECT * FROM lesson_plans WHERE grade = $1 ORDER BY created_at DESC`,
      [grade]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get lesson plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLessonPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade, subject, chapter_name, status } = req.body;
    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === 'parent') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO lesson_plans (grade, subject, chapter_name, status, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [grade, subject, chapter_name, status || 'Planned', userId]
    );

    res.status(201).json({ message: 'Lesson plan created', data: result.rows[0] });
  } catch (error) {
    console.error('Create lesson plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

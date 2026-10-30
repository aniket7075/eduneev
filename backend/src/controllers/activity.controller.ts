import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDailyActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const { date } = req.query; // optional filter by date

    let query = `SELECT * FROM daily_activities WHERE student_id = $1`;
    const params: any[] = [student_id];

    if (date) {
      query += ` AND date = $2`;
      params.push(date);
    }
    
    query += ` ORDER BY date DESC, created_at DESC LIMIT 30`;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get daily activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logDailyActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const { date, nap_start, nap_end, meals_eaten, mood, notes } = req.body;
    
    await pool.query(
      `INSERT INTO daily_activities (student_id, date, nap_start, nap_end, meals_eaten, mood, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [student_id, date, nap_start || null, nap_end || null, meals_eaten, mood, notes]
    );
    
    res.status(201).json({ message: 'Daily activity logged successfully' });
  } catch (error) {
    console.error('Log daily activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

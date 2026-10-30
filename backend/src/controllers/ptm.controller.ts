import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getPtmSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const result = await pool.query(
      `SELECT * FROM ptm_schedules WHERE school_id = $1 ORDER BY date DESC`,
      [school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get PTM schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPtmSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const { teacher_id, date, start_time, end_time, slot_duration } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ptm_schedules (school_id, teacher_id, date, start_time, end_time, slot_duration) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [school_id, teacher_id, date, start_time, end_time, slot_duration || 15]
    );
    
    res.status(201).json({ message: 'PTM Schedule created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create PTM schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookPtmSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const { ptm_id, student_id, time_slot } = req.body;
    
    // Check if slot is already booked
    const existing = await pool.query(
      `SELECT id FROM ptm_bookings WHERE ptm_id = $1 AND time_slot = $2`,
      [ptm_id, time_slot]
    );
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Slot already booked' });
      return;
    }
    
    const result = await pool.query(
      `INSERT INTO ptm_bookings (ptm_id, student_id, school_id, time_slot) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ptm_id, student_id, school_id, time_slot]
    );
    
    res.status(201).json({ message: 'PTM Slot booked successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Book PTM slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

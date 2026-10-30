import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school_id = req.user?.school_id;
    let query = `SELECT * FROM events`;
    const params: any[] = [];
    
    if (school_id) {
      query += ` WHERE school_id = $1`;
      params.push(school_id);
    }
    query += ` ORDER BY start_date ASC`;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows || [] });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(200).json({ data: [] });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const { title, description, start_date, end_date, type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO events (school_id, title, description, start_date, end_date, type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [school_id, title, description, start_date, end_date, type || 'event']
    );
    
    res.status(201).json({ message: 'Event created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

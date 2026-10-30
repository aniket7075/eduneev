import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getFoodMenus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.school_id || req.query.school_id || null;
    const result = await pool.query(
      `SELECT * FROM food_menus WHERE ($1::uuid IS NULL OR school_id = $1::uuid) ORDER BY date DESC LIMIT 30`,
      [schoolId]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get food menus error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFoodMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let schoolId = req.user?.school_id || req.body.school_id;
    if (!schoolId) {
      const s = await pool.query('SELECT id FROM schools LIMIT 1');
      if (s.rows.length > 0) schoolId = s.rows[0].id;
    }
    const { date, breakfast, lunch, snacks } = req.body;
    
    // Check if menu for date exists
    const existing = await pool.query(`SELECT id FROM food_menus WHERE school_id = $1 AND date = $2`, [schoolId, date]);
    
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE food_menus SET breakfast = $1, lunch = $2, snacks = $3 WHERE school_id = $4 AND date = $5`,
        [breakfast, lunch, snacks, schoolId, date]
      );
      res.status(200).json({ message: 'Food menu updated successfully' });
    } else {
      await pool.query(
        `INSERT INTO food_menus (school_id, date, breakfast, lunch, snacks) 
         VALUES ($1, $2, $3, $4, $5)`,
        [schoolId, date, breakfast, lunch, snacks]
      );
      res.status(201).json({ message: 'Food menu created successfully' });
    }
  } catch (error) {
    console.error('Create food menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFoodMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if the record exists
    const existing = await pool.query(`SELECT id FROM food_menus WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Food menu not found' });
      return;
    }

    await pool.query(`DELETE FROM food_menus WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Food menu deleted successfully' });
  } catch (error) {
    console.error('Delete food menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

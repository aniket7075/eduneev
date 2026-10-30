import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const result = await pool.query(
      `SELECT * FROM payments WHERE school_id = $1 ORDER BY date DESC`,
      [school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { school_id } = req.user!;
    const { student_id, fee_id, amount, transaction_id, payment_method } = req.body;
    
    const result = await pool.query(
      `INSERT INTO payments (student_id, fee_id, school_id, amount, transaction_id, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [student_id, fee_id, school_id, amount, transaction_id, 'Completed', payment_method || 'Online']
    );
    
    res.status(201).json({ message: 'Payment recorded successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

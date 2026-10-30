import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { notifyLeaveStatus } from '../services/notification.service';

export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { student_id, start_date, end_date, reason } = req.body;
    const parentEmail = req.user?.email;

    if (!student_id && req.user?.role === 'parent') {
      const studentLookup = await pool.query(
        `SELECT s.id FROM students s 
         JOIN parents p ON s.parent_id = p.id 
         WHERE LOWER(p.email) = LOWER($1) 
         LIMIT 1`,
        [parentEmail]
      );
      if (studentLookup.rows.length > 0) {
        student_id = studentLookup.rows[0].id;
      }
    }

    if (!student_id || !start_date || !end_date || !reason) {
      res.status(400).json({ error: 'student_id, start_date, end_date, and reason are required' });
      return;
    }

    // Verify the student belongs to this parent (security check)
    if (req.user?.role === 'parent') {
      const verify = await pool.query(
        `SELECT s.id FROM students s 
         JOIN parents p ON s.parent_id = p.id 
         WHERE s.id = $1 AND p.email = $2`,
        [student_id, parentEmail]
      );
      if (verify.rows.length === 0) {
        res.status(403).json({ error: 'Student does not belong to this parent' });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO leave_applications (student_id, start_date, end_date, reason, status) 
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [student_id, start_date, end_date, reason]
    );

    res.status(201).json({ message: 'Leave application submitted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const userEmail = req.user?.email;

    let query = '';
    let queryParams: any[] = [];

    if (role === 'parent') {
      // Get leaves for children belonging to this parent (join via parents table by email)
      query = `
        SELECT la.*, 
               s.first_name || ' ' || s.last_name AS student_name, 
               s.grade,
               s.admission_number
        FROM leave_applications la
        JOIN students s ON la.student_id = s.id
        JOIN parents p ON s.parent_id = p.id
        WHERE p.email = $1
        ORDER BY la.created_at DESC
      `;
      queryParams = [userEmail];
    } else {
      // Teacher or Admin sees all
      query = `
        SELECT la.*, 
               s.first_name || ' ' || s.last_name AS student_name, 
               s.grade,
               s.admission_number,
               p.name AS parent_name,
               p.contact_number
        FROM leave_applications la
        JOIN students s ON la.student_id = s.id
        LEFT JOIN parents p ON s.parent_id = p.id
        ORDER BY la.created_at DESC
      `;
    }

    const result = await pool.query(query, queryParams);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.user?.role;

    if (role === 'parent') {
      res.status(403).json({ error: 'Parents cannot update leave status' });
      return;
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or pending' });
      return;
    }

    const result = await pool.query(
      `UPDATE leave_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Leave application not found' });
      return;
    }

    // Trigger instant push notification to parent
    notifyLeaveStatus(String(id), status).catch(err => {
      console.error('Error notifying parent of leave status:', err);
    });

    res.status(200).json({ message: `Leave ${status} successfully`, data: result.rows[0] });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { start_date, end_date, reason } = req.body;
    const parentEmail = req.user?.email;

    if (req.user?.role !== 'parent') {
      res.status(403).json({ error: 'Only parents can update their leave applications' });
      return;
    }

    // Check if the leave belongs to a student of this parent and is pending
    const checkRes = await pool.query(
      `SELECT la.status FROM leave_applications la
       JOIN students s ON la.student_id = s.id
       JOIN parents p ON s.parent_id = p.id
       WHERE la.id = $1 AND p.email = $2`,
      [id, parentEmail]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ error: 'Leave application not found' });
      return;
    }

    if (checkRes.rows[0].status !== 'pending') {
      res.status(400).json({ error: 'Can only update pending leave applications' });
      return;
    }

    const result = await pool.query(
      `UPDATE leave_applications SET start_date = $1, end_date = $2, reason = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [start_date, end_date, reason, id]
    );

    res.json({ message: 'Leave application updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parentEmail = req.user?.email;

    const role = req.user?.role;
    if (role === 'super_admin' || role === 'school_admin' || role === 'teacher') {
      await pool.query('DELETE FROM leave_applications WHERE id = $1', [id]);
      res.json({ message: 'Leave application deleted successfully' });
      return;
    }

    const checkRes = await pool.query(
      `SELECT la.status FROM leave_applications la
       JOIN students s ON la.student_id = s.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE la.id = $1 AND (p.email = $2 OR s.parent_id = $3)`,
      [id, parentEmail, req.user?.id]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ error: 'Leave application not found' });
      return;
    }

    await pool.query('DELETE FROM leave_applications WHERE id = $1', [id]);
    res.json({ message: 'Leave application deleted successfully' });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

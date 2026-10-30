import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

export const getCameras = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuperAdmin = isSuperAdminUser(req);
    const tenantSchoolId = getTenantSchoolId(req);

    let query = 'SELECT * FROM cctv_cameras ORDER BY created_at DESC';
    const params: any[] = [];

    if (tenantSchoolId) {
      query = 'SELECT * FROM cctv_cameras WHERE (school_id = $1 OR school_id IS NULL) ORDER BY created_at DESC';
      params.push(tenantSchoolId);
    } else {
      query = 'SELECT * FROM cctv_cameras ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addCamera = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, stream_url, status, school_id } = req.body;
    const resolvedSchoolId = getTenantSchoolId(req) || school_id || null;

    const result = await pool.query(
      `INSERT INTO cctv_cameras (name, location, stream_url, status, school_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, location, stream_url, status || 'active', resolvedSchoolId]
    );
    res.status(201).json({ message: 'Camera added successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Add camera error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCamera = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location, stream_url, status } = req.body;
    
    const result = await pool.query(
      `UPDATE cctv_cameras 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           stream_url = COALESCE($3, stream_url),
           status = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [name, location, stream_url, status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }

    res.status(200).json({ message: 'Camera updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update camera error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCamera = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`DELETE FROM cctv_cameras WHERE id = $1 RETURNING id`, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }

    res.status(200).json({ message: 'Camera deleted successfully' });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

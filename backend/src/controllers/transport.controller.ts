import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

export const getTransportRoutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuperAdmin = isSuperAdminUser(req);
    const tenantSchoolId = getTenantSchoolId(req);

    let query = `
      SELECT tr.*, COUNT(st.id)::int AS assigned_students_count
      FROM transport_routes tr
      LEFT JOIN student_transport st ON tr.id = st.route_id
      GROUP BY tr.id
      ORDER BY tr.route_name ASC
    `;
    const params: any[] = [];

    if (tenantSchoolId) {
      query = `
        SELECT tr.*, COUNT(st.id)::int AS assigned_students_count
        FROM transport_routes tr
        LEFT JOIN student_transport st ON tr.id = st.route_id
        WHERE tr.school_id = $1
        GROUP BY tr.id
        ORDER BY tr.route_name ASC
      `;
      params.push(tenantSchoolId);
    } else if (!isSuperAdmin) {
      res.status(200).json({ data: [] });
      return;
    }

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get transport routes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudentTransport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;

    const result = await pool.query(
      `SELECT st.*, tr.route_name, tr.driver_name, tr.driver_phone, tr.vehicle_number, tr.vehicle_type, tr.capacity
       FROM student_transport st
       JOIN transport_routes tr ON st.route_id = tr.id
       WHERE st.student_id = $1`,
      [student_id]
    );

    res.status(200).json({ data: result.rows[0] || null });
  } catch (error) {
    console.error('Get student transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransportRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  const { route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity, school_id } = req.body;
  if (!route_name || !driver_name || !driver_phone || !vehicle_number || !capacity) {
    res.status(400).json({ error: 'Missing required route fields' });
    return;
  }

  const resolvedSchoolId = getTenantSchoolId(req) || school_id || null;

  try {
    const result = await pool.query(
      `INSERT INTO transport_routes (route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [route_name, driver_name, driver_phone, vehicle_number, vehicle_type || 'bus', parseInt(capacity), resolvedSchoolId]
    );
    res.status(201).json({ message: 'Transport route created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create transport route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTransportRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity } = req.body;
  if (!route_name || !driver_name || !driver_phone || !vehicle_number || !capacity) {
    res.status(400).json({ error: 'Missing required route fields' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE transport_routes 
       SET route_name = $1, driver_name = $2, driver_phone = $3, vehicle_number = $4, vehicle_type = $5, capacity = $6
       WHERE id = $7 RETURNING *`,
      [route_name, driver_name, driver_phone, vehicle_number, vehicle_type || 'bus', parseInt(capacity), id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    res.json({ message: 'Transport route updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update transport route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTransportRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM transport_routes WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    res.json({ message: 'Transport route deleted' });
  } catch (error) {
    console.error('Delete transport route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignStudentTransport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { student_id, route_id, pickup_point, pickup_time, drop_time } = req.body;
  if (!student_id || !route_id || !pickup_point) {
    res.status(400).json({ error: 'student_id, route_id, and pickup_point are required' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO student_transport (student_id, route_id, pickup_point, pickup_time, drop_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id) DO UPDATE 
       SET route_id = EXCLUDED.route_id, pickup_point = EXCLUDED.pickup_point,
           pickup_time = EXCLUDED.pickup_time, drop_time = EXCLUDED.drop_time
       RETURNING *`,
      [student_id, route_id, pickup_point, pickup_time || null, drop_time || null]
    );
    res.status(201).json({ message: 'Student transport assigned', data: result.rows[0] });
  } catch (error) {
    console.error('Assign transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRouteStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { route_id } = req.params;
    const result = await pool.query(
      `SELECT st.id AS transport_id, st.pickup_point, st.pickup_time, st.drop_time,
              s.id AS student_id, s.first_name, s.last_name, s.admission_number, s.grade, s.profile_image_url,
              p.name AS parent_name, p.contact_number AS parent_phone
       FROM student_transport st
       JOIN students s ON st.student_id = s.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE st.route_id = $1
       ORDER BY s.first_name ASC`,
      [route_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get route students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeStudentTransport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    await pool.query('DELETE FROM student_transport WHERE student_id = $1', [student_id]);
    res.status(200).json({ message: 'Student removed from transport route' });
  } catch (error) {
    console.error('Remove student transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


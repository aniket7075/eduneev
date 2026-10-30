import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

export const getClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantSchoolId = getTenantSchoolId(req);

    // Delete any legacy standalone 'Kg' or 'KG' entry if present
    await pool.query(`DELETE FROM classes WHERE LOWER(TRIM(name)) = 'kg'`).catch(() => null);

    // Auto-seed standard preschool classes if empty
    const checkCount = await pool.query('SELECT COUNT(*) FROM classes');
    if (parseInt(checkCount.rows[0].count || '0') === 0) {
      await pool.query(`
        INSERT INTO classes (name, section, capacity, description) VALUES
        ('Playgroup', 'A', 30, 'Playgroup (1.5 - 2.5 yrs)'),
        ('Nursery', 'A', 30, 'Nursery (2.5 - 3.5 yrs)'),
        ('Jr KG', 'A', 30, 'Junior KG / LKG (3.5 - 4.5 yrs)'),
        ('Sr KG', 'A', 30, 'Senior KG / UKG (4.5 - 6 yrs)'),
        ('Daycare', 'A', 20, 'Full Day & Half Daycare Services')
      `).catch(() => null);
    }

    const result = await pool.query(
      `SELECT c.id, c.name, COALESCE(c.section, 'A') AS section, COALESCE(c.capacity, 30) AS capacity,
              c.description, c.created_at, c.class_teacher_id, 
              u.first_name AS teacher_first_name, u.last_name AS teacher_last_name,
              COUNT(st.id)::int AS enrolled_count,
              GREATEST(COALESCE(c.capacity, 30) - COUNT(st.id)::int, 0)::int AS vacant_seats
       FROM classes c
       LEFT JOIN users u ON c.class_teacher_id = u.id
       LEFT JOIN students st ON (
         st.is_active = true 
         AND ($1::uuid IS NULL OR st.school_id = $1)
         AND (
           LOWER(TRIM(st.grade)) = LOWER(TRIM(c.name))
           OR LOWER(TRIM(st.grade)) LIKE LOWER(TRIM(c.name)) || '%'
           OR (LOWER(c.name) LIKE '%jr%' AND (LOWER(st.grade) LIKE '%lkg%' OR LOWER(st.grade) LIKE '%junior%' OR LOWER(st.grade) = 'kg'))
           OR (LOWER(c.name) LIKE '%sr%' AND (LOWER(st.grade) LIKE '%ukg%' OR LOWER(st.grade) LIKE '%senior%'))
           OR (LOWER(c.name) LIKE '%play%' AND LOWER(st.grade) LIKE '%play%')
           OR (LOWER(c.name) LIKE '%nursery%' AND LOWER(st.grade) LIKE '%nursery%')
           OR (LOWER(c.name) LIKE '%daycare%' AND LOWER(st.grade) LIKE '%daycare%')
         )
       )
       WHERE ($1::uuid IS NULL OR c.school_id = $1 OR c.school_id IS NULL)
       GROUP BY c.id, u.first_name, u.last_name
       ORDER BY c.created_at ASC, c.name ASC`,
      [tenantSchoolId || null]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, section, capacity, description, class_teacher_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Class name is required' });
    return;
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO classes (name, section, capacity, description, class_teacher_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, section || 'A', capacity ? parseInt(capacity) : 30, description || null, class_teacher_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create class error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'A class with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, section, capacity, description, class_teacher_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Class name is required' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE classes 
       SET name = $1, section = COALESCE($2, section), capacity = COALESCE($3, capacity), description = $4, class_teacher_id = $5
       WHERE id = $6 RETURNING *`,
      [name, section || null, capacity ? parseInt(capacity) : null, description || null, class_teacher_id || null, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM classes WHERE id = $1 RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    // If foreign key constraint fails
    if (error.code === '23503') {
      res.status(400).json({ error: 'Cannot delete class because it has associated sections or students' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

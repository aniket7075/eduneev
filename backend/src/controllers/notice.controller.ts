import { sendNotification, sendMulticastNotification } from '../config/firebase';
import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId, isSuperAdminUser } from '../middlewares/auth.middleware';

export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, audience, date, school_id } = req.body;
    const authorId = req.user?.id || null;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    let resolvedSchoolId = getTenantSchoolId(req) || school_id || null;
    if (!resolvedSchoolId) {
      const schoolRes = await pool.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
      if (schoolRes.rows.length > 0) resolvedSchoolId = schoolRes.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO notices (title, content, audience, date, created_by, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, audience || 'all', date || new Date().toISOString().split('T')[0], authorId, resolvedSchoolId]
    );

    // Trigger push notifications asynchronously
    (async () => {
      try {
        const targetAud = (audience || 'all').toLowerCase().trim();
        let fcmQuery = `
          SELECT DISTINCT u.fcm_token 
          FROM users u 
          WHERE u.fcm_token IS NOT NULL AND u.is_active = true
        `;
        const params: any[] = [];

        if (targetAud === 'parents') {
          fcmQuery += " AND u.role = 'parent'";
        } else if (targetAud === 'teachers') {
          fcmQuery += " AND u.role = 'teacher'";
        } else if (targetAud !== 'all' && targetAud !== 'everyone') {
          // If audience targets a grade (e.g. 'Playgroup' or 'LKG') or specific student
          fcmQuery = `
            SELECT DISTINCT u.fcm_token 
            FROM users u
            WHERE u.fcm_token IS NOT NULL AND u.is_active = true AND (
              u.role IN ('super_admin', 'school_admin')
              OR u.id IN (
                SELECT p.id FROM parents p
                JOIN students s ON s.parent_id = p.id
                WHERE LOWER(TRIM(s.grade)) = $1
              )
              OR u.email IN (
                SELECT p.email FROM parents p
                JOIN students s ON s.parent_id = p.id
                WHERE LOWER(TRIM(s.grade)) = $1
              )
            )
          `;
          params.push(targetAud);
        }

        const fcmUsers = await pool.query(fcmQuery, params);
        const tokens = fcmUsers.rows.map(r => r.fcm_token).filter(Boolean);
        if (tokens.length > 0) {
          await sendMulticastNotification(
            tokens,
            `📢 ${title}`,
            content.slice(0, 100),
            { type: 'notice', id: result.rows[0].id }
          );
        }
      } catch (fcmErr) {
        console.error('Notice FCM error:', fcmErr);
      }
    })();

    res.status(201).json({ message: 'Notice published', data: result.rows[0] });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);
    const role = req.user?.role;
    const email = req.user?.email || '';
    const userId = req.user?.id || '';

    let query = `
      SELECT n.*, u.first_name || ' ' || u.last_name AS author_name, sch.name AS school_name
      FROM notices n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN schools sch ON n.school_id = sch.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenantSchoolId) {
      query += ` AND (n.school_id = $1 OR n.school_id IS NULL)`;
      params.push(tenantSchoolId);
    } else if (!isSuper && role !== 'parent') {
      res.status(200).json({ data: [] });
      return;
    }

    if (role === 'parent') {
      const emailParamIndex = params.length + 1;
      const userParamIndex = params.length + 2;
      query += ` AND (
        TRIM(LOWER(COALESCE(n.audience, 'all'))) IN ('all', 'parents', 'everyone', 'all parents')
        OR LOWER(n.content) LIKE LOWER('%' || $${emailParamIndex} || '%')
        OR TRIM(LOWER(n.audience)) IN (
          SELECT LOWER(TRIM(s.grade)) FROM students s
          LEFT JOIN parents p ON s.parent_id = p.id
          WHERE (LOWER(p.email) = LOWER($${emailParamIndex}) OR s.parent_id = $${userParamIndex} OR s.parent_id IN (SELECT id FROM parents WHERE LOWER(email) = LOWER($${emailParamIndex})))
        )
        OR n.audience IN (
          SELECT 'student:' || s.id FROM students s
          LEFT JOIN parents p ON s.parent_id = p.id
          WHERE (LOWER(p.email) = LOWER($${emailParamIndex}) OR s.parent_id = $${userParamIndex} OR s.parent_id IN (SELECT id FROM parents WHERE LOWER(email) = LOWER($${emailParamIndex})))
        )
      )`;
      params.push(email, userId);
    }

    query += ` ORDER BY n.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, audience, date } = req.body;
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if (!isSuper && tenantSchoolId) {
      const checkN = await pool.query('SELECT id FROM notices WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)', [id, tenantSchoolId]);
      if (checkN.rows.length === 0) {
        res.status(403).json({ error: 'Access denied: Notice belongs to another branch.' });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE notices SET title = $1, content = $2, audience = $3, date = $4
       WHERE id = $5 RETURNING *`,
      [title, content, audience, date, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Notice not found' });
      return;
    }
    res.json({ message: 'Notice updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantSchoolId = getTenantSchoolId(req);
    const isSuper = isSuperAdminUser(req);

    if (!isSuper && tenantSchoolId) {
      const checkN = await pool.query('SELECT id FROM notices WHERE id = $1 AND school_id = $2', [id, tenantSchoolId]);
      if (checkN.rows.length === 0) {
        res.status(403).json({ error: 'Access denied: Notice belongs to another branch.' });
        return;
      }
    }

    const result = await pool.query('DELETE FROM notices WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Notice not found' });
      return;
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

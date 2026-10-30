import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    console.log(`Login attempt for email: ${cleanEmail}`);

    if (!cleanEmail || !password) {
      console.log('Login failed: missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 AND is_active = true', [cleanEmail]);
    
    if (result.rows.length === 0) {
      console.log(`Login failed: user not found or inactive for email ${cleanEmail}`);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log(`Login failed: invalid password for email ${cleanEmail}`);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Query user's school / branch
    let schoolId: string | null = user.school_id || null;
    let schoolName: string | null = null;

    try {
      const schoolRes = await pool.query(
        `SELECT s.id, s.name 
         FROM schools s 
         JOIN user_schools us ON us.school_id = s.id 
         WHERE us.user_id = $1
         UNION
         SELECT s.id, s.name 
         FROM schools s 
         JOIN staff_profiles sp ON sp.school_id = s.id 
         WHERE sp.user_id = $1
         UNION
         SELECT s.id, s.name
         FROM schools s
         WHERE s.id = $2
         LIMIT 1`,
        [user.id, user.school_id || null]
      );

      if (schoolRes.rows.length > 0) {
        schoolId = schoolRes.rows[0].id;
        schoolName = schoolRes.rows[0].name;
      } else {
        let branchQuery = '%Chinchwad%';
        if (cleanEmail.includes('chikhali')) {
          branchQuery = '%Chikhali%';
        } else if (cleanEmail.includes('dudulgaon')) {
          branchQuery = '%Dudulgaon%';
        }
        const bRes = await pool.query('SELECT id, name FROM schools WHERE LOWER(name) LIKE LOWER($1) LIMIT 1', [branchQuery]);
        if (bRes.rows.length > 0) {
          schoolId = bRes.rows[0].id;
          schoolName = bRes.rows[0].name;
          await pool.query('UPDATE users SET school_id = $1 WHERE id = $2', [schoolId, user.id]).catch(() => null);
          await pool.query('INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, schoolId]).catch(() => null);
        } else {
          schoolName = 'Chinchwad Branch';
        }
      }
    } catch (e) {
      console.error('Error resolving user school:', e);
      schoolName = 'Chinchwad Branch';
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, school_id: schoolId },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    let childName: string | null = null;
    let className: string | null = null;
    let studentId: string | null = null;

    let childrenList: any[] = [];

    if (user.role === 'parent' || user.role === 'student') {
      const childRes = await pool.query(
        `SELECT s.id, s.first_name, s.last_name, s.first_name || ' ' || s.last_name AS full_name, s.grade, s.admission_number, s.profile_image_url 
         FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE LOWER(p.email) = $1 
            OR s.parent_id = $2
            OR s.id = $2
            OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
            OR (LOWER(p.name) LIKE '%' || LOWER($3) || '%' AND s.school_id = $4)
            OR (LOWER(s.emergency_contact_name) LIKE '%' || LOWER($3) || '%' AND s.school_id = $4)
         ORDER BY s.created_at ASC`,
        [cleanEmail, user.id, user.first_name || '', schoolId]
      ).catch((err) => {
        console.error('Child lookup query error:', err);
        return { rows: [] };
      });

      childrenList = childRes.rows;
      if (childRes.rows.length > 0) {
        studentId = childRes.rows[0].id;
        childName = childRes.rows[0].full_name;
        className = childRes.rows[0].grade;
      }
    } else if (user.role === 'teacher') {
      const teacherClassRes = await pool.query(
        `SELECT id, name, section FROM classes WHERE class_teacher_id = $1 LIMIT 1`,
        [user.id]
      ).catch(() => ({ rows: [] }));

      if (teacherClassRes.rows.length > 0) {
        className = teacherClassRes.rows[0].name;
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        childName: childName || (user.first_name ? `${user.first_name}'s Child` : 'My Child'),
        student_id: studentId,
        className: className || (user.role === 'teacher' ? '' : 'Playgroup'),
        grade: className || (user.role === 'teacher' ? '' : 'Playgroup'),
        children: childrenList,
        phoneNumber: user.phone_number || null,
        profilePictureUrl: user.profile_picture_url || null,
        school_id: schoolId,
        school_name: schoolName,
        branchName: schoolName,
        allowed_screens: user.allowed_screens || null
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || String(error)
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phoneNumber } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password || !role || !firstName || !lastName) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name, phone_number, profile_picture_url`,
      [cleanEmail, passwordHash, role, firstName, lastName, phoneNumber || null]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phoneNumber: newUser.phone_number || null,
        profilePictureUrl: newUser.profile_picture_url || null,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

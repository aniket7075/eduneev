import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    school_id?: string | null;
  };
}

export const isSuperAdminUser = (req: AuthRequest): boolean => {
  const role = req.user?.role?.toLowerCase() || '';
  const email = req.user?.email?.toLowerCase() || '';
  return role === 'super_admin' || role === 'owner' || email === 'admin@edunive.com' || email === 'admin@prescole.com';
};

/**
 * Returns the effective school_id for the request.
 * For non-super admins, this ALWAYS returns their own branch school_id,
 * ignoring any query parameter or body parameter to strictly enforce multi-tenant isolation.
 * For super admins, returns the query/body school_id (if provided), or null (meaning all branches).
 */
export const getTenantSchoolId = (req: AuthRequest): string | null => {
  if (isSuperAdminUser(req)) {
    const querySchoolId = req.query.school_id as string;
    const bodySchoolId = req.body?.school_id as string;
    const val = querySchoolId || bodySchoolId;
    if (!val || val === 'ALL' || val === 'all' || val === 'undefined' || val === 'null') {
      return null;
    }
    return val;
  }
  return req.user?.school_id || null;
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
      email: string;
      school_id?: string | null;
    };

    req.user = decoded;

    // If school_id is missing from token, resolve it from database
    if (!req.user.school_id && req.user.id) {
      try {
        const schoolRes = await pool.query(
          `SELECT school_id FROM users WHERE id = $1 AND school_id IS NOT NULL
           UNION
           SELECT school_id FROM user_schools WHERE user_id = $1
           UNION
           SELECT school_id FROM staff_profiles WHERE user_id = $1
           LIMIT 1`,
          [req.user.id]
        );
        if (schoolRes.rows.length > 0) {
          req.user.school_id = schoolRes.rows[0].school_id;
        } else {
          // Check if email contains branch name hint
          const emailLower = (req.user.email || '').toLowerCase();
          let branchMatch = '';
          if (emailLower.includes('chikhali')) branchMatch = '%chikhali%';
          else if (emailLower.includes('dudulgaon')) branchMatch = '%dudulgaon%';
          else if (emailLower.includes('chinchwad')) branchMatch = '%chinchwad%';

          if (branchMatch) {
            const matchRes = await pool.query('SELECT id FROM schools WHERE LOWER(name) LIKE $1 LIMIT 1', [branchMatch]);
            if (matchRes.rows.length > 0) {
              req.user.school_id = matchRes.rows[0].id;
              // Persist mapping
              await pool.query('UPDATE users SET school_id = $1 WHERE id = $2', [matchRes.rows[0].id, req.user.id]).catch(() => null);
              await pool.query('INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, matchRes.rows[0].id]).catch(() => null);
            }
          }
        }
      } catch (err) {
        console.error('Error resolving fallback school_id in auth middleware:', err);
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

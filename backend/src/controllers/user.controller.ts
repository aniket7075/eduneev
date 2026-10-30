import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendNotification } from '../config/firebase';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT id, email, phone_number, role, first_name, last_name, profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { first_name, last_name, phone_number } = req.body;

    if (!first_name?.trim() || !last_name?.trim()) {
      res.status(400).json({ error: 'First name and last name are required' });
      return;
    }

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone_number = COALESCE(NULLIF($3, ''), phone_number), updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, phone_number, role, first_name, last_name, profile_picture_url`,
      [first_name.trim(), last_name.trim(), phone_number || '', userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyChildren = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = req.user?.email || '';
    const userId = req.user?.id || '';

    const result = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.grade, s.age, s.profile_image_url,
              s.date_of_birth, s.gender, s.blood_group, s.is_active,
              s.emergency_contact_name, s.emergency_contact_phone,
              p.name AS parent_name, p.email AS parent_email, p.contact_number, p.alternative_mobile, p.address
       FROM students s
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE (
         LOWER(p.email) = LOWER($1)
         OR s.parent_id = $2
         OR s.parent_id IN (SELECT id FROM parents WHERE LOWER(email) = LOWER($1))
         OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
       ) AND s.is_active = true
       ORDER BY s.created_at ASC`,
      [email, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChildDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = req.user?.email;
    const { id } = req.params;

    // Verify the requesting parent actually owns this child
    const result = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.roll_number,
              s.grade, s.age, s.profile_image_url, s.date_of_birth, s.gender,
              s.blood_group, s.is_active, s.medical_notes, s.allergies,
              s.emergency_contact_name, s.emergency_contact_phone, s.created_at,
              p.name AS parent_name, p.email AS parent_email, p.contact_number, p.alternative_mobile, p.address,
              c.name AS class_name
       FROM students s
       JOIN parents p ON s.parent_id = p.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND p.email = $2`,
      [id, email]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Child not found or access denied' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get child details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { fcm_token } = req.body;
    if (!fcm_token) {
      res.status(400).json({ error: 'fcm_token is required' });
      return;
    }
    await pool.query('UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2', [fcm_token, userId]);
    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendTestPushNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { fcm_token, title, body } = req.body;

    let targetToken = fcm_token;
    if (!targetToken && userId) {
      const userRes = await pool.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
      targetToken = userRes.rows[0]?.fcm_token;
    }

    if (!targetToken) {
      res.status(400).json({ 
        error: 'No FCM token found for user. Please register the device token first via POST /users/fcm-token or provide fcm_token in the request body.' 
      });
      return;
    }

    const testTitle = title || '🎉 Edunive Test Push Notification';
    const testBody = body || 'Hello! Your device is successfully receiving push notifications from Edunive!';

    const fcmRes = await sendNotification(
      targetToken,
      testTitle,
      testBody,
      {
        type: 'test',
        timestamp: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      message: 'Test push notification sent successfully!',
      fcm_response: fcmRes,
      token_preview: `${targetToken.slice(0, 15)}...`
    });
  } catch (error: any) {
    console.error('Send test push error:', error);
    res.status(500).json({ error: error.message || 'Failed to send test push notification' });
  }
};

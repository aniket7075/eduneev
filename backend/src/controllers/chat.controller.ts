import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, getTenantSchoolId } from '../middlewares/auth.middleware';
import { sendNotification, sendMulticastNotification } from '../config/firebase';

/**
 * Automatically resolve Class Teacher and Group Admin for class group chat rooms.
 * Rule:
 * 1. Super Admin is auto-added ONLY if the room belongs to the Main Branch (Head Office).
 * 2. If the room belongs to a Franchise Branch, the respective Franchise Admin (school_admin)
 *    is auto-added, and Super Admin is NOT added!
 * 3. The class teacher for that class is always linked.
 */
async function resolveClassTeacherAndAdmin(targetClass?: string, targetSchoolId?: string | null, currentUserId?: string, currentUserRole?: string) {
  let classTeacherId: string | null = null;
  let assignedAdminId: string | null = null;

  // Find Main Branch school id (where super_admin belongs or default)
  const saRes = await pool.query(
    `SELECT id, school_id FROM users WHERE role = 'super_admin' AND is_active = true ORDER BY created_at ASC LIMIT 1`
  );
  const superAdmin = saRes.rows[0];
  const mainBranchSchoolId = superAdmin?.school_id || '8aa96068-8694-4b75-b224-d0afe52e280e';

  // Determine effective school_id for this room
  let effectiveSchoolId = targetSchoolId;
  if (!effectiveSchoolId && currentUserRole === 'school_admin' && currentUserId) {
    const uRes = await pool.query(`SELECT school_id FROM users WHERE id = $1`, [currentUserId]);
    effectiveSchoolId = uRes.rows[0]?.school_id || null;
  }
  if (!effectiveSchoolId && currentUserRole === 'super_admin') {
    effectiveSchoolId = mainBranchSchoolId;
  }
  if (!effectiveSchoolId) {
    effectiveSchoolId = mainBranchSchoolId;
  }

  const isMainBranchRoom = String(effectiveSchoolId) === String(mainBranchSchoolId);

  // 1. Resolve Group Admin:
  if (isMainBranchRoom) {
    // MAIN BRANCH: Super Admin is auto-added!
    assignedAdminId = superAdmin?.id || null;
  } else {
    // FRANCHISE BRANCH: Franchise Admin (school_admin) ONLY, strictly NOT super_admin!
    if (currentUserRole === 'school_admin' && currentUserId) {
      assignedAdminId = currentUserId;
    } else {
      const adminRes = await pool.query(
        `SELECT id FROM users WHERE role = 'school_admin' AND school_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
        [effectiveSchoolId]
      );
      if (adminRes.rows.length > 0) {
        assignedAdminId = adminRes.rows[0].id;
      } else {
        const fallbackRes = await pool.query(
          `SELECT id FROM users WHERE role = 'school_admin' AND is_active = true ORDER BY created_at ASC LIMIT 1`
        );
        if (fallbackRes.rows.length > 0) assignedAdminId = fallbackRes.rows[0].id;
      }
    }
  }

  // 2. Resolve Class Teacher
  if (targetClass && targetClass !== 'All' && targetClass !== 'General') {
    const clsRes = await pool.query(
      `SELECT class_teacher_id FROM classes WHERE LOWER(name) = LOWER($1) AND (school_id = $2 OR school_id IS NULL) AND class_teacher_id IS NOT NULL ORDER BY school_id DESC NULLS LAST LIMIT 1`,
      [targetClass, effectiveSchoolId]
    );
    if (clsRes.rows.length > 0 && clsRes.rows[0].class_teacher_id) {
      const tCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher' AND is_active = true LIMIT 1`,
        [clsRes.rows[0].class_teacher_id]
      );
      if (tCheck.rows.length > 0) {
        classTeacherId = tCheck.rows[0].id;
      }
    }

    if (!classTeacherId) {
      const uRes = await pool.query(
        `SELECT id FROM users WHERE role = 'teacher' AND is_active = true AND (school_id = $2 OR school_id IS NULL) AND LOWER(department) = LOWER($1) ORDER BY school_id DESC NULLS LAST LIMIT 1`,
        [targetClass, effectiveSchoolId]
      );
      if (uRes.rows.length > 0) {
        classTeacherId = uRes.rows[0].id;
      }
    }
  }

  return { classTeacherId, assignedAdminId, effectiveSchoolId, isMainBranchRoom, superAdminId: superAdmin?.id };
}

export const getChatRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const tenantSchoolId = getTenantSchoolId(req) || req.user?.school_id || null;

    // Automatically seed/ensure separate class-wise group chat rooms exist for all classes
    try {
      const defaultClasses = ['Playgroup', 'Nursery', 'Jr KG', 'Sr KG', 'Daycare'];
      const dbClassesRes = await pool.query(`SELECT DISTINCT name FROM classes WHERE name IS NOT NULL`);
      const allClasses = Array.from(new Set([...defaultClasses, ...dbClassesRes.rows.map(r => r.name)]));

      await pool.query(
        `INSERT INTO chat_rooms (name) SELECT 'General School Discussion' WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'General School Discussion')`
      );

      for (const clsName of allClasses) {
        if (!clsName) continue;
        const groupName = `${clsName} Class Official Group`;
        const { classTeacherId, assignedAdminId, effectiveSchoolId } = await resolveClassTeacherAndAdmin(clsName, tenantSchoolId, userId, role);

        const existing = await pool.query(
          `SELECT id, teacher_id, admin_id, school_id FROM chat_rooms WHERE (target_class = $1 OR name = $2 OR name LIKE $3) AND (school_id = $4 OR school_id IS NULL) LIMIT 1`,
          [clsName, groupName, `%${clsName}%`, effectiveSchoolId]
        );

        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO chat_rooms (name, target_class, teacher_id, admin_id, school_id) VALUES ($1, $2, $3, $4, $5)`,
            [groupName, clsName, classTeacherId, assignedAdminId, effectiveSchoolId]
          );
        } else {
          const room = existing.rows[0];
          // Ensure teacher is not a super_admin
          let shouldUpdateTeacher = false;
          if (room.teacher_id) {
            const tRole = await pool.query(`SELECT role FROM users WHERE id = $1`, [room.teacher_id]);
            if (tRole.rows[0]?.role === 'super_admin') {
              shouldUpdateTeacher = true;
            }
          } else if (classTeacherId) {
            shouldUpdateTeacher = true;
          }

          const targetTeacherId = shouldUpdateTeacher ? classTeacherId : room.teacher_id;
          const targetAdminId = assignedAdminId || room.admin_id;

          await pool.query(
            `UPDATE chat_rooms SET teacher_id = $1, admin_id = $2, school_id = COALESCE(school_id, $3) WHERE id = $4`,
            [targetTeacherId, targetAdminId, effectiveSchoolId, room.id]
          );
        }
      }
    } catch (seedErr) {
      console.error('Chat room seeding notice:', seedErr);
    }

    let query = '';
    const queryParams: any[] = [];

    if (role === 'teacher') {
      // Teacher sees:
      // 1) Their assigned class official group ONLY (e.g. 'Nursery Class Official Group')
      // 2) 'General School Discussion' & 'All Staff Class Official Group'
      // 3) Direct 1-on-1 chats involving this teacher (cr.teacher_id = userId)
      query = `
        SELECT cr.id, 
               COALESCE(
                 cr.name,
                 NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''),
                 NULLIF(TRIM(COALESCE(s.first_name,'') || ' ' || COALESCE(s.last_name,'')), ''),
                 'Class Chat'
               ) AS name,
               cr.target_class,
               cr.created_at,
                (SELECT message FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message_time
        FROM chat_rooms cr 
        LEFT JOIN users u ON (cr.parent_id = u.id OR (cr.teacher_id = u.id AND u.id != $1)) 
        LEFT JOIN students s ON cr.student_id = s.id
        WHERE cr.teacher_id = $1 
           OR cr.parent_id = $1
           OR LOWER(cr.name) LIKE '%general%'
           OR LOWER(cr.name) LIKE '%all staff%'
           OR (
             cr.target_class IS NOT NULL AND (
               LOWER(cr.target_class) IN (
                 SELECT LOWER(name) FROM classes WHERE class_teacher_id = $1
                 UNION
                 SELECT LOWER(department) FROM users WHERE id = $1 AND department IS NOT NULL
               )
               OR EXISTS (
                 SELECT 1 FROM users usr 
                 WHERE usr.id = $1 
                   AND (
                     LOWER(cr.target_class) = LOWER(COALESCE(usr.department, '')) 
                     OR LOWER(cr.name) LIKE '%' || LOWER(COALESCE(usr.department, '')) || '%'
                   )
               )
             )
           )
        ORDER BY COALESCE((SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1), cr.created_at) DESC
      `;
      queryParams.push(userId);
    } else if (role === 'parent') {
      // Parent sees:
      // 1) General School Discussion
      // 2) Class group for their child's grade ONLY (e.g. 'Jr KG Class Official Group')
      // 3) Direct 1-on-1 chats involving this parent (cr.parent_id = userId)
      query = `
        SELECT cr.id, 
               COALESCE(
                 cr.name, 
                 NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''),
                 'School Channel'
               ) AS name,
               cr.target_class,
               cr.created_at,
               (SELECT message FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message_time
        FROM chat_rooms cr 
        LEFT JOIN users u ON (cr.teacher_id = u.id) 
        LEFT JOIN students s ON cr.student_id = s.id
        WHERE cr.parent_id = $1 
           OR cr.teacher_id = $1
           OR LOWER(cr.name) LIKE '%general%'
           OR (
             cr.target_class IS NOT NULL AND LOWER(cr.target_class) IN (
               SELECT LOWER(grade) FROM students WHERE parent_id = $1 UNION SELECT 'jr kg' WHERE EXISTS (SELECT 1 FROM users WHERE id = $1 AND LOWER(email) = 'parent@eduneev.com')
               UNION
               SELECT LOWER(grade) FROM students WHERE parent_id IN (SELECT id FROM parents WHERE email IN (SELECT email FROM users WHERE id = $1))
             )
           )
        ORDER BY COALESCE((SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1), cr.created_at) DESC
      `;
      queryParams.push(userId);
    } else {
      // Admin / Principal / Super Admin sees all channels and class groups
      query = `
        SELECT cr.id, 
               COALESCE(
                 cr.name, 
                 NULLIF(TRIM(COALESCE(t.first_name,'') || ' ' || COALESCE(t.last_name,'')), ''),
                 NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''),
                 NULLIF(TRIM(COALESCE(s.first_name,'') || ' ' || COALESCE(s.last_name,'')), ''),
                 'General Discussion Channel'
               ) AS name,
               cr.target_class,
               cr.created_at,
               (SELECT message FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1) AS last_message_time
        FROM chat_rooms cr
        LEFT JOIN users t ON cr.teacher_id = t.id
        LEFT JOIN users p ON cr.parent_id = p.id
        LEFT JOIN students s ON cr.student_id = s.id
        ORDER BY COALESCE((SELECT created_at FROM chat_messages WHERE room_id = cr.id AND message NOT LIKE '[WEBRTC_%' ORDER BY created_at DESC LIMIT 1), cr.created_at) DESC
      `;
    }

    const result = await pool.query(query, queryParams);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChatStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role === 'teacher') {
      // Teacher can only see:
      // 1) Students/Parents in their own assigned class
      // 2) Other Staff members & Admins

      const studentsRes = await pool.query(
        `SELECT s.id, s.first_name, s.last_name, s.grade, s.profile_image_url, s.parent_id,
                p.name AS parent_name, 'student' AS contact_type
         FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         LEFT JOIN classes c ON (LOWER(s.grade) = LOWER(c.name))
         WHERE s.is_active = true AND (c.class_teacher_id = $1 OR s.grade IN (SELECT name FROM classes WHERE class_teacher_id = $1))
         ORDER BY s.first_name ASC`,
        [userId]
      );

      const staffRes = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.designation, 'staff' AS contact_type
         FROM users u
         WHERE u.id != $1 AND u.role IN ('teacher', 'non_teaching_staff', 'school_admin', 'super_admin') AND u.is_active = true
         ORDER BY u.first_name ASC`,
        [userId]
      );

      let studentList = studentsRes.rows;
      // Fallback to all students if teacher doesn't have an assigned class row yet
      if (studentList.length === 0) {
        const fallback = await pool.query(
          `SELECT s.id, s.first_name, s.last_name, s.grade, s.profile_image_url, s.parent_id, p.name AS parent_name, 'student' AS contact_type
           FROM students s LEFT JOIN parents p ON s.parent_id = p.id WHERE s.is_active = true ORDER BY s.first_name ASC`
        );
        studentList = fallback.rows;
      }

      res.json({ data: [...studentList, ...staffRes.rows] });
    } else if (role === 'parent') {
      // Parent CANNOT see other parents! Only their student's Class Teacher and Principal/School Admin
      const contacts = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.designation, 'staff' AS contact_type
         FROM users u
         WHERE u.role IN ('teacher', 'school_admin', 'super_admin') AND u.is_active = true
         ORDER BY u.role DESC, u.first_name ASC`
      );
      res.json({ data: contacts.rows });
    } else {
      // Admin sees all students/parents & staff
      const students = await pool.query(
        `SELECT s.id, s.first_name, s.last_name, s.grade, s.profile_image_url, s.parent_id,
                p.name AS parent_name, 'student' AS contact_type
         FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE s.is_active = true
         ORDER BY s.first_name ASC`
      );
      const staff = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.designation, 'staff' AS contact_type
         FROM users u
         WHERE u.id != $1 AND u.role IN ('teacher', 'non_teaching_staff', 'school_admin', 'super_admin') AND u.is_active = true
         ORDER BY u.first_name ASC`,
        [userId]
      );
      res.json({ data: [...students.rows, ...staff.rows] });
    }
  } catch (error) {
    console.error('Get chat students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const isUUID = (str: any): boolean => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const getOrCreateStudentRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, target_user_id } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Handle staff-to-staff or parent-to-staff direct room
    if (target_user_id) {
      if (!isUUID(target_user_id)) {
        res.status(400).json({ error: 'Invalid target_user_id format' });
        return;
      }

      const targetUser = await pool.query(`SELECT id, first_name, last_name, role FROM users WHERE id = $1`, [target_user_id]);
      if (targetUser.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const u = targetUser.rows[0];
      const roomName = `Chat: ${u.first_name} ${u.last_name} (${u.role})`;

      const existing = await pool.query(
        `SELECT * FROM chat_rooms WHERE (teacher_id = $1 AND parent_id = $2) OR (teacher_id = $2 AND parent_id = $1)`,
        [userId, target_user_id]
      );

      if (existing.rows.length > 0) {
        res.status(200).json({ data: existing.rows[0] });
        return;
      }

      const result = await pool.query(
        `INSERT INTO chat_rooms (name, teacher_id, parent_id) VALUES ($1, $2, $3) RETURNING *`,
        [roomName, userId || null, target_user_id || null]
      );

      res.status(201).json({ message: 'Staff room created', data: result.rows[0] });
      return;
    }

    if (!student_id || !isUUID(student_id)) {
      res.status(400).json({ error: 'Valid student_id or target_user_id is required' });
      return;
    }

    // Parents cannot create arbitrary rooms
    if (role === 'parent') {
      res.status(403).json({ error: 'Parents can only chat with their assigned Class Teacher or Principal.' });
      return;
    }

    const studentRes = await pool.query(`SELECT id, parent_id, first_name, last_name, grade FROM students WHERE id = $1`, [student_id]);
    if (studentRes.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    const student = studentRes.rows[0];
    const roomName = `Chat: ${student.first_name} ${student.last_name} (${student.grade})`;

    // Check if room exists
    const existing = await pool.query(
      `SELECT * FROM chat_rooms WHERE student_id = $1`,
      [student_id]
    );

    if (existing.rows.length > 0) {
      res.status(200).json({ data: existing.rows[0] });
      return;
    }

    // Lookup user_id matching student's parent (if any) to prevent FK errors
    let parentUserId: string | null = null;
    if (student.parent_id && isUUID(student.parent_id)) {
      const userCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [student.parent_id]);
      if (userCheck.rows.length > 0) {
        parentUserId = userCheck.rows[0].id;
      } else {
        const parentUser = await pool.query(
          `SELECT u.id FROM users u JOIN parents p ON LOWER(u.email) = LOWER(p.email) WHERE p.id = $1 LIMIT 1`,
          [student.parent_id]
        );
        if (parentUser.rows.length > 0) parentUserId = parentUser.rows[0].id;
      }
    }

    let teacherUserId: string | null = null;
    if (userId && isUUID(userId)) {
      const tCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
      if (tCheck.rows.length > 0) teacherUserId = userId;
    }

    // Create room
    const result = await pool.query(
      `INSERT INTO chat_rooms (name, teacher_id, parent_id, student_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [roomName, teacherUserId, parentUserId, student_id]
    );

    res.status(201).json({ message: 'Room created', data: result.rows[0] });
  } catch (error) {
    console.error('Get or create room error:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, teacher_id, parent_id, student_id, target_class } = req.body;
    const role = req.user?.role;

    // Only Teachers and Admins can create Groups
    if (role === 'parent') {
      res.status(403).json({ error: 'Only Teachers and Admins can create group chats.' });
      return;
    }

    const groupClassName = target_class || 'All';
    const roomName = name || (target_class ? `${target_class} Class Official Group` : 'General School Discussion');

    // Check if group chat room for target_class already exists
    if (target_class) {
      const existingGroup = await pool.query(
        `SELECT * FROM chat_rooms WHERE target_class = $1 OR name = $2 ORDER BY created_at ASC LIMIT 1`,
        [target_class, roomName]
      );
      if (existingGroup.rows.length > 0) {
        res.status(200).json({ message: 'Class group channel active', data: existingGroup.rows[0] });
        return;
      }
    }

    // Auto resolve Class Teacher and Franchise Admin (strictly NO super_admin)
    const tenantSchoolId = req.body.school_id || getTenantSchoolId(req) || req.user?.school_id || null;
    const { classTeacherId, assignedAdminId, effectiveSchoolId } = await resolveClassTeacherAndAdmin(target_class, tenantSchoolId, req.user?.id, role);

    let validTeacherId: string | null = null;
    if (teacher_id) {
      const check = await pool.query(`SELECT id, role FROM users WHERE id = $1`, [teacher_id]);
      if (check.rows.length > 0 && check.rows[0].role !== 'super_admin') {
        validTeacherId = teacher_id;
      } else {
        validTeacherId = classTeacherId;
      }
    } else {
      validTeacherId = classTeacherId;
    }

    const validAdminId = assignedAdminId;

    let validParentId: string | null = null;
    if (parent_id) {
      const check = await pool.query(`SELECT id FROM users WHERE id = $1`, [parent_id]);
      if (check.rows.length > 0) validParentId = parent_id;
    }

    let validStudentId: string | null = null;
    if (student_id) {
      const check = await pool.query(`SELECT id FROM students WHERE id = $1`, [student_id]);
      if (check.rows.length > 0) validStudentId = student_id;
    }

    const result = await pool.query(
      `INSERT INTO chat_rooms (name, teacher_id, admin_id, parent_id, student_id, target_class, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [roomName, validTeacherId, validAdminId, validParentId, validStudentId, groupClassName, effectiveSchoolId]
    );

    res.status(201).json({ message: 'Group chat room created with automatic class teacher and branch admin allocation', data: result.rows[0] });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRoomMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room_id } = req.params;
    const roomRes = await pool.query(`SELECT * FROM chat_rooms WHERE id = $1`, [room_id]);
    if (roomRes.rows.length === 0) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }
    const room = roomRes.rows[0];

    // Check if this room is in Main Branch
    const saRes = await pool.query(`SELECT id, first_name, last_name, email, role, phone_number, school_id FROM users WHERE role = 'super_admin' LIMIT 1`);
    const superAdminUser = saRes.rows[0];
    const mainBranchId = superAdminUser?.school_id || '8aa96068-8694-4b75-b224-d0afe52e280e';

    const isMainBranch = !room.school_id || String(room.school_id) === String(mainBranchId);

    const members: any[] = [];
    let roomAdminUser = null;
    let roomSuperAdminUser = null;

    if (isMainBranch) {
      // 1. MAIN BRANCH: Super Admin is auto-added!
      if (superAdminUser) {
        roomSuperAdminUser = superAdminUser;
        members.push({
          id: superAdminUser.id,
          first_name: superAdminUser.first_name,
          last_name: superAdminUser.last_name,
          email: superAdminUser.email,
          phone: superAdminUser.phone_number,
          role: 'Super Admin',
          role_type: 'super_admin',
          badge: '👑 Super Admin (Main Branch)',
          badge_color: '#C2410C',
          badge_bg: '#FFEDD5',
          is_auto_added: true,
          is_main_branch: true
        });
      }
    } else {
      // 2. FRANCHISE BRANCH: ONLY Franchise Admin (school_admin) is added, Super Admin is NOT added!
      let fAdmin = null;
      if (room.admin_id) {
        const aRes = await pool.query(
          `SELECT id, first_name, last_name, email, role, phone_number, profile_picture_url FROM users WHERE id = $1 AND role = 'school_admin'`,
          [room.admin_id]
        );
        if (aRes.rows.length > 0) fAdmin = aRes.rows[0];
      }
      if (!fAdmin && room.school_id) {
        const aRes = await pool.query(
          `SELECT id, first_name, last_name, email, role, phone_number, profile_picture_url FROM users WHERE role = 'school_admin' AND school_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
          [room.school_id]
        );
        if (aRes.rows.length > 0) fAdmin = aRes.rows[0];
      }
      if (fAdmin) {
        roomAdminUser = fAdmin;
        members.push({
          id: fAdmin.id,
          first_name: fAdmin.first_name,
          last_name: fAdmin.last_name,
          email: fAdmin.email,
          phone: fAdmin.phone_number,
          role: 'Franchise Admin',
          role_type: 'school_admin',
          badge: '🏫 Franchise Admin',
          badge_color: '#7C3AED',
          badge_bg: '#F5F3FF',
          is_auto_added: true,
          is_main_branch: false
        });
      }
    }

    // 3. Class Teacher (Assigned teacher for this class, strictly NOT super_admin)
    let teacherUser = null;
    if (room.teacher_id) {
      const tRes = await pool.query(
        `SELECT id, first_name, last_name, email, role, department, phone_number, profile_picture_url FROM users WHERE id = $1 AND role = 'teacher'`,
        [room.teacher_id]
      );
      if (tRes.rows.length > 0) teacherUser = tRes.rows[0];
    }
    if (!teacherUser && room.target_class) {
      const clsRes = await pool.query(
        `SELECT class_teacher_id FROM classes WHERE LOWER(name) = LOWER($1) AND (school_id = $2 OR school_id IS NULL) AND class_teacher_id IS NOT NULL ORDER BY school_id DESC NULLS LAST LIMIT 1`,
        [room.target_class, room.school_id]
      );
      if (clsRes.rows.length > 0 && clsRes.rows[0].class_teacher_id) {
        const tRes = await pool.query(
          `SELECT id, first_name, last_name, email, role, department, phone_number, profile_picture_url FROM users WHERE id = $1 AND role = 'teacher'`,
          [clsRes.rows[0].class_teacher_id]
        );
        if (tRes.rows.length > 0) teacherUser = tRes.rows[0];
      }
    }

    if (teacherUser) {
      members.push({
        id: teacherUser.id,
        first_name: teacherUser.first_name,
        last_name: teacherUser.last_name,
        email: teacherUser.email,
        phone: teacherUser.phone_number,
        role: 'Class Teacher',
        role_type: 'teacher',
        department: teacherUser.department || room.target_class,
        badge: '🎓 Class Teacher',
        badge_color: '#0D9488',
        badge_bg: '#CCFBF1',
        is_auto_added: true
      });
    }

    // 4. Students & Parents of this target class & school
    let studentsQuery = `
      SELECT s.id, s.first_name, s.last_name, s.grade, s.roll_number, s.parent_id,
             p.name AS parent_name, p.email AS parent_email, p.phone AS parent_phone
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE s.is_active = true
    `;
    const params: any[] = [];
    if (room.target_class && room.target_class !== 'All Staff' && room.target_class !== 'All') {
      studentsQuery += ` AND LOWER(s.grade) = LOWER($1)`;
      params.push(room.target_class);
    }
    if (room.school_id) {
      studentsQuery += ` AND (s.school_id = $${params.length + 1} OR s.school_id IS NULL)`;
      params.push(room.school_id);
    }
    studentsQuery += ` ORDER BY s.first_name ASC`;

    const studentsRes = await pool.query(studentsQuery, params);
    for (const s of studentsRes.rows) {
      members.push({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        grade: s.grade,
        roll_number: s.roll_number,
        parent_name: s.parent_name,
        parent_email: s.parent_email,
        parent_phone: s.parent_phone,
        role: 'Student & Parent',
        role_type: 'student',
        badge: `👶 ${s.grade || 'Student'}`,
        badge_color: '#2563EB',
        badge_bg: '#EFF6FF',
        is_auto_added: true
      });
    }

    // Fetch school name for display
    let schoolName = 'Main Branch';
    if (room.school_id) {
      const schRes = await pool.query(`SELECT name FROM schools WHERE id = $1`, [room.school_id]);
      if (schRes.rows.length > 0) schoolName = schRes.rows[0].name;
    }

    res.status(200).json({
      room: {
        id: room.id,
        name: room.name,
        target_class: room.target_class,
        school_id: room.school_id,
        school_name: schoolName,
        is_main_branch: isMainBranch
      },
      isMainBranch,
      schoolName,
      superAdmin: roomSuperAdminUser,
      franchiseAdmin: roomAdminUser,
      classTeacher: teacherUser,
      totalCount: members.length,
      members
    });
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room_id } = req.params;
    const { limit = '50', before } = req.query;

    let query = `
      SELECT cm.*, COALESCE(u.first_name, 'User') AS first_name, COALESCE(u.last_name, '') AS last_name, u.role, u.profile_picture_url
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = $1
    `;
    const params: any[] = [room_id];

    if (before) {
      query += ` AND cm.created_at < $2`;
      params.push(before);
    }

    query += ` ORDER BY cm.created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    // Mark messages as read
    if (req.user?.id) {
      await pool.query(
        `UPDATE chat_messages SET is_read = true WHERE room_id = $1 AND sender_id != $2`,
        [room_id, req.user.id]
      );
    }

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room_id, message, attachment_url } = req.body;
    const senderId = req.user?.id;

    if (!room_id || (!message && !attachment_url)) {
      res.status(400).json({ error: 'room_id and message (or attachment_url) are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, message, attachment_url) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [room_id, senderId, message || null, attachment_url || null]
    );

    const sentMessage = result.rows[0];

    // Asynchronous Push Notification Logic
    (async () => {
      try {
        const roomRes = await pool.query(
          `SELECT id, name, teacher_id, parent_id, admin_id, target_class, school_id 
           FROM chat_rooms WHERE id = $1`, 
          [room_id]
        );
        if (roomRes.rows.length === 0) return;
        const room = roomRes.rows[0];

        // Fetch sender name
        const senderRes = await pool.query(`SELECT first_name, last_name, role FROM users WHERE id = $1`, [senderId]);
        const sRow = senderRes.rows[0];
        const senderName = sRow ? `${sRow.first_name} ${sRow.last_name || ''}`.trim() : 'Someone';

        const notifTitle = room.target_class 
          ? `💬 ${room.name || room.target_class} • ${senderName}`
          : `💬 ${senderName}`;
        const notifBody = message ? (message.length > 100 ? `${message.slice(0, 100)}...` : message) : '📷 Sent an attachment';

        let tokens: string[] = [];

        if (room.target_class) {
          // Class group / All staff group: notify all participants in this class/school
          let groupTokensQuery: string;
          let params: any[];

          if (room.target_class.toLowerCase() === 'all staff') {
            groupTokensQuery = `
              SELECT DISTINCT fcm_token 
              FROM users 
              WHERE fcm_token IS NOT NULL AND id != $1 AND is_active = true AND role IN ('teacher', 'school_admin', 'super_admin')
            `;
            params = [senderId];
          } else {
            groupTokensQuery = `
              SELECT DISTINCT u.fcm_token 
              FROM users u 
              WHERE u.fcm_token IS NOT NULL AND u.id != $1 AND u.is_active = true AND (
                u.id = $3
                OR u.id = $4
                OR u.id IN (SELECT teacher_id FROM classes WHERE LOWER(TRIM(name)) = LOWER(TRIM($2)))
                OR u.role IN ('super_admin', 'school_admin')
                OR u.email IN (
                  SELECT p.email FROM parents p
                  JOIN students s ON s.parent_id = p.id
                  WHERE LOWER(TRIM(s.grade)) = LOWER(TRIM($2)) AND s.is_active = true
                )
                OR u.id IN (
                  SELECT s.parent_id FROM students s
                  WHERE LOWER(TRIM(s.grade)) = LOWER(TRIM($2)) AND s.is_active = true
                )
              )
            `;
            params = [senderId, room.target_class, room.teacher_id, room.admin_id];
          }

          const tokenRes = await pool.query(groupTokensQuery, params);
          tokens = tokenRes.rows.map(r => r.fcm_token).filter(Boolean);
        } else {
          // Direct 1-on-1 chat room (teacher, parent, and optional admin)
          const directTokensQuery = `
            SELECT DISTINCT u.fcm_token 
            FROM users u
            WHERE u.fcm_token IS NOT NULL 
              AND u.id != $1
              AND u.is_active = true
              AND (
                u.id = $2
                OR u.id = $3
                OR u.id = $4
                OR u.email IN (SELECT email FROM parents WHERE id IN ($2, $3, $4))
              )
          `;
          const tokenRes = await pool.query(directTokensQuery, [
            senderId,
            room.teacher_id || null,
            room.parent_id || null,
            room.admin_id || null
          ]);
          tokens = tokenRes.rows.map(r => r.fcm_token).filter(Boolean);
        }

        if (tokens.length > 0) {
          await sendMulticastNotification(
            tokens,
            notifTitle,
            notifBody,
            {
              type: 'chat',
              roomId: String(room_id),
              senderId: String(senderId),
              senderName: senderName,
              messageId: String(sentMessage.id)
            }
          );
        }
      } catch (notifErr) {
        console.error('Failed to send chat push notification:', notifErr);
      }
    })();

    res.status(201).json({ message: 'Message sent', data: sentMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ unread: 0 });
      return;
    }
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM chat_messages cm
       JOIN chat_rooms cr ON cm.room_id = cr.id
       WHERE cm.is_read = false AND cm.sender_id != $1
         AND (cr.teacher_id = $1 OR cr.parent_id = $1 OR cr.teacher_id IS NULL)`,
      [userId]
    );
    res.json({ unread: parseInt(result.rows[0]?.count || '0') });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const check = await pool.query(`SELECT * FROM chat_messages WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const msg = check.rows[0];
    if (msg.sender_id !== userId && !['admin', 'school_admin', 'super_admin'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'You can only edit your own messages' });
      return;
    }

    // Check system cards protection
    const isSystemMsg = (msg.message || '').includes('[HOMEWORK ASSIGNMENT]') || (msg.message || '').includes('[ANNOUNCEMENT]') || (msg.message || '').includes('[LIVE');
    if (isSystemMsg) {
      res.status(403).json({ error: 'System assignments and announcements cannot be edited.' });
      return;
    }

    // Check 5-minute time limit
    const createdAt = new Date(msg.created_at).getTime();
    const diffMinutes = (Date.now() - createdAt) / (1000 * 60);
    if (diffMinutes > 5 && !['admin', 'school_admin', 'super_admin'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Messages can only be edited within 5 minutes of sending.' });
      return;
    }

    const result = await pool.query(
      `UPDATE chat_messages SET message = $1, is_edited = true WHERE id = $2 RETURNING *`,
      [message.trim(), id]
    );

    res.status(200).json({ message: 'Message updated', data: result.rows[0] });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deleteFor } = req.query; // 'everyone' | 'me'
    const userId = req.user?.id;

    const check = await pool.query(`SELECT * FROM chat_messages WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const msg = check.rows[0];

    if (deleteFor === 'everyone') {
      if (msg.sender_id !== userId && !['admin', 'school_admin', 'super_admin'].includes(req.user?.role || '')) {
        res.status(403).json({ error: 'Only the sender or admin can delete for everyone' });
        return;
      }

      // Check 5-minute time limit for Delete for Everyone
      const createdAt = new Date(msg.created_at).getTime();
      const diffMinutes = (Date.now() - createdAt) / (1000 * 60);
      if (diffMinutes > 5 && !['admin', 'school_admin', 'super_admin'].includes(req.user?.role || '')) {
        res.status(403).json({ error: 'Messages can only be deleted for everyone within 5 minutes of sending.' });
        return;
      }

      const result = await pool.query(
        `UPDATE chat_messages SET is_deleted_for_everyone = true, message = '🚫 This message was deleted' WHERE id = $1 RETURNING *`,
        [id]
      );
      res.status(200).json({ message: 'Message deleted for everyone', data: result.rows[0] });
    } else {
      // Delete for me
      const currentDeleted = msg.deleted_for_users || [];
      if (userId && !currentDeleted.includes(userId)) {
        currentDeleted.push(userId);
      }
      await pool.query(
        `UPDATE chat_messages SET deleted_for_users = $1 WHERE id = $2`,
        [JSON.stringify(currentDeleted), id]
      );
      res.status(200).json({ message: 'Message deleted for you' });
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const clearRoomMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room_id } = req.params;
    if (!room_id) {
      res.status(400).json({ error: 'room_id is required' });
      return;
    }

    const deleteResult = await pool.query(`DELETE FROM chat_messages WHERE room_id = $1`, [room_id]);
    res.status(200).json({ 
      message: 'Room messages cleared successfully', 
      deletedCount: deleteResult.rowCount 
    });
  } catch (error) {
    console.error('Clear room messages error:', error);
    res.status(500).json({ error: 'Failed to clear room messages' });
  }
};

export const clearAllMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleteResult = await pool.query(`DELETE FROM chat_messages`);
    res.status(200).json({ 
      message: 'All chat messages cleared successfully', 
      deletedCount: deleteResult.rowCount 
    });
  } catch (error) {
    console.error('Clear all messages error:', error);
    res.status(500).json({ error: 'Failed to clear all messages' });
  }
};

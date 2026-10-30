const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // 1. Add admin_id column if not exists
  await pool.query("ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id)");
  console.log('✅ Added admin_id column to chat_rooms');

  // 2. Find default franchise admin (school_admin)
  const saRes = await pool.query("SELECT id, email, first_name, last_name FROM users WHERE role = 'school_admin' ORDER BY created_at ASC LIMIT 1");
  const franchiseAdmin = saRes.rows[0];
  console.log('Franchise Admin found:', franchiseAdmin);

  // 3. Update existing class groups:
  // Set teacher_id to class teacher from classes table (never super_admin)
  // Set admin_id to franchise admin (school_admin)
  const rooms = await pool.query("SELECT id, name, target_class, teacher_id FROM chat_rooms WHERE target_class IS NOT NULL");
  for (const r of rooms.rows) {
    const clsRes = await pool.query("SELECT class_teacher_id FROM classes WHERE LOWER(name) = LOWER($1) AND class_teacher_id IS NOT NULL LIMIT 1", [r.target_class]);
    let classTeacherId = clsRes.rows[0]?.class_teacher_id || null;

    if (!classTeacherId) {
      // Check teachers table by department
      const tRes = await pool.query("SELECT id FROM users WHERE role = 'teacher' AND is_active = true AND LOWER(department) = LOWER($1) LIMIT 1", [r.target_class]);
      if (tRes.rows.length > 0) classTeacherId = tRes.rows[0].id;
    }

    // Check if current teacher_id is a super_admin - if so, strip it
    let finalTeacherId = classTeacherId;
    if (!finalTeacherId && r.teacher_id) {
      const checkRole = await pool.query("SELECT role FROM users WHERE id = $1", [r.teacher_id]);
      if (checkRole.rows[0]?.role !== 'super_admin') {
        finalTeacherId = r.teacher_id;
      }
    }

    await pool.query(
      "UPDATE chat_rooms SET teacher_id = $1, admin_id = $2 WHERE id = $3",
      [finalTeacherId, franchiseAdmin?.id || null, r.id]
    );
    console.log(`Updated room ${r.name}: teacher_id=${finalTeacherId}, admin_id=${franchiseAdmin?.id}`);
  }

  // 4. Verify
  const verified = await pool.query(`
    SELECT cr.id, cr.name, cr.target_class, 
           tu.email as teacher_email, tu.first_name as teacher_name,
           au.email as admin_email, au.first_name as admin_name
    FROM chat_rooms cr
    LEFT JOIN users tu ON cr.teacher_id = tu.id
    LEFT JOIN users au ON cr.admin_id = au.id
    WHERE cr.target_class IS NOT NULL
  `);
  console.table(verified.rows);

  pool.end();
}

run();

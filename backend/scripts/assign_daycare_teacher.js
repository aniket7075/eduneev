const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Find teacher@eduneev.com
  const teacherRes = await pool.query("SELECT id, email, first_name, last_name FROM users WHERE email = 'teacher@eduneev.com'");
  if (teacherRes.rows.length === 0) {
    console.log('Teacher not found');
    pool.end();
    return;
  }
  const teacher = teacherRes.rows[0];
  console.log('Assigning teacher:', teacher);

  // Assign to Daycare
  const updateRes = await pool.query(
    "UPDATE classes SET class_teacher_id = $1 WHERE name = 'Daycare' RETURNING *",
    [teacher.id]
  );
  console.log('Updated class:', updateRes.rows[0]);

  // Verify
  const verifyRes = await pool.query(
    "SELECT c.id, c.name, c.class_teacher_id, u.email, u.first_name FROM classes c LEFT JOIN users u ON c.class_teacher_id = u.id"
  );
  console.log('All classes now:');
  console.log(verifyRes.rows);

  pool.end();
}

run().catch(console.error);

const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const users = await pool.query("SELECT id, email, role, first_name, last_name FROM users WHERE role = 'teacher'");
  console.log('TEACHERS:');
  console.log(users.rows);

  const classes = await pool.query("SELECT id, name, section, class_teacher_id FROM classes");
  console.log('CLASSES:');
  console.log(classes.rows);
  pool.end();
}

run().catch(console.error);

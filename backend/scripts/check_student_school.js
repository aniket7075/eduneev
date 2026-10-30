const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const r = await pool.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'school_id'");
  console.log('students.school_id:', r.rows);

  const st = await pool.query("SELECT id, first_name, school_id FROM students");
  console.log('students sample:', st.rows);
  await pool.end();
}

check();

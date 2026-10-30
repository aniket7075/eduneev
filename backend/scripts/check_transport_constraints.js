const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const r = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'student_transport'::regclass;
    `);
    console.log('student_transport constraints:', r.rows);

    // Make sure student_id has unique constraint
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_student_transport_student_id ON student_transport (student_id);
    `);
    console.log('Ensured unique index on student_transport(student_id)');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

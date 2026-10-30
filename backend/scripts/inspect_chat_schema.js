const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const admins = await pool.query("SELECT id, email, first_name, last_name, role, school_id FROM users WHERE role = 'school_admin'");
  console.log('School admins (Franchise admins):', admins.rows);

  const supers = await pool.query("SELECT id, email, first_name, last_name, role, school_id FROM users WHERE role = 'super_admin'");
  console.log('Super admins:', supers.rows);

  pool.end();
}

run();

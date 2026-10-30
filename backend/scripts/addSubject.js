require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addSubject() {
  try {
    await pool.query('ALTER TABLE homework ADD COLUMN IF NOT EXISTS subject VARCHAR(100);');
    console.log('Subject column added successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
addSubject();

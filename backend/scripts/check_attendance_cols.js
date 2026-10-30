const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance'`
    );
    console.log('Columns in attendance table:', res.rows.map(r => r.column_name));

    // Add in_time, out_time, remarks if not present
    await pool.query(`
      ALTER TABLE attendance 
      ADD COLUMN IF NOT EXISTS in_time VARCHAR(20),
      ADD COLUMN IF NOT EXISTS out_time VARCHAR(20),
      ADD COLUMN IF NOT EXISTS remarks TEXT;
    `);
    console.log('Successfully ensured in_time, out_time, remarks exist in attendance table!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

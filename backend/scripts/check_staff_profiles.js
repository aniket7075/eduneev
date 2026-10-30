const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkStaffProfiles() {
  try {
    const res = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_profiles'
    `);
    console.log('staff_profiles columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await pool.end();
  }
}

checkStaffProfiles();

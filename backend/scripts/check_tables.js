const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkTables() {
  try {
    const resTables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema='public'
    `);
    console.log('Tables in DB:', resTables.rows.map(r => r.table_name));

    const checkEnquiries = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'enquiries'
    `);
    console.log('enquiries columns:', checkEnquiries.rows.map(r => r.column_name));

    const checkStaff = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'staff'
    `);
    console.log('staff columns:', checkStaff.rows.map(r => r.column_name));

    const checkPayrolls = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'payrolls'
    `);
    console.log('payrolls columns:', checkPayrolls.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await pool.end();
  }
}

checkTables();

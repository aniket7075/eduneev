const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const sCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
    console.log('students cols:', sCols.rows.map(r => r.column_name));

    const invCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_items'");
    console.log('inventory_items cols:', invCols.rows.map(r => r.column_name));

    const trCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'transport_routes'");
    console.log('transport_routes cols:', trCols.rows.map(r => r.column_name));

    const stCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'student_transport'");
    console.log('student_transport cols:', stCols.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

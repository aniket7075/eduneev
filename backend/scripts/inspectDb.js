const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log('Students Table Columns:');
    console.log(res.rows);

    const resParents = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parents'
    `);
    console.log('Parents Table Columns:');
    console.log(resParents.rows);
  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await pool.end();
  }
}

inspect();

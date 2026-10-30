const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStudents() {
  try {
    const colRes = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log('Students columns:', colRes.rows.map(r => r.column_name).join(', '));
    const sample = await pool.query('SELECT id, first_name, grade FROM students LIMIT 3');
    console.log('Sample students:', sample.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkStudents();

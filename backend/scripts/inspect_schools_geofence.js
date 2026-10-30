const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchoolsGeofence() {
  try {
    const colRes = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'schools'
    `);
    console.log('--- SCHOOLS COLUMNS ---');
    console.log(colRes.rows.map(r => r.column_name).join(', '));

    const schoolsRes = await pool.query(`
      SELECT id, name, address, latitude, longitude, geofence_radius FROM schools
    `).catch(err => {
      console.log('Query failed:', err.message);
      return { rows: [] };
    });
    console.log('Schools data:', schoolsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkSchoolsGeofence();

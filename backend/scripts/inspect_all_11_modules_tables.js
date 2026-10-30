const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function inspect11() {
  const tables = [
    'classes', 'timetables', 'certificates', 'daycare_logs',
    'franchises', 'expenses', 'staff_profiles', 'payrolls',
    'notices', 'leaves', 'galleries', 'gallery_photos'
  ];

  for (const t of tables) {
    try {
      const res = await pool.query(`
        SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1
      `, [t]);
      console.log(`=== TABLE: ${t} (${res.rows.length} columns) ===`);
      if (res.rows.length === 0) {
        console.log(`❌ TABLE DOES NOT EXIST: ${t}`);
      } else {
        console.log(res.rows.map(r => r.column_name).join(', '));
      }
    } catch (err) {
      console.error(`Error inspecting ${t}:`, err.message);
    }
  }
  await pool.end();
}

inspect11();

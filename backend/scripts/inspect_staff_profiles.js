const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStaffAndProfiles() {
  try {
    const usersRes = await pool.query(`
      SELECT id, first_name, last_name, email, role, school_id 
      FROM users 
      WHERE role IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    `);
    console.log(`Found ${usersRes.rows.length} staff users:`);
    console.log(usersRes.rows.map(u => `${u.first_name} ${u.last_name} (${u.role}, school: ${u.school_id})`));

    const profilesRes = await pool.query(`
      SELECT sp.id, sp.user_id, sp.base_salary, sp.designation, u.first_name 
      FROM staff_profiles sp 
      JOIN users u ON sp.user_id = u.id
    `);
    console.log(`Found ${profilesRes.rows.length} staff profiles:`);
    console.log(profilesRes.rows);

    const payrollsRes = await pool.query(`
      SELECT * FROM payrolls
    `);
    console.log(`Found ${payrollsRes.rows.length} existing payrolls:`);
    console.log(payrollsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkStaffAndProfiles();

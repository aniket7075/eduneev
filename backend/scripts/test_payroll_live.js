const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testPayrollLive() {
  try {
    // 1. Fetch payroll for October 2026
    const res = await pool.query(`
      SELECT p.*,
             COALESCE(p.basic_salary, 25000) AS base_salary,
             u.id AS user_id,
             u.first_name || ' ' || u.last_name AS staff_name,
             u.role::text AS role, 
             COALESCE(sp.department, 'Academics') AS department, 
             COALESCE(sp.designation, 'Preschool Teacher') AS designation, 
             COALESCE(sp.employee_id, 'EMP-101') AS employee_id,
             COALESCE(s.name, 'Chinchwad Branch') AS branch_name
      FROM payrolls p
      JOIN staff_profiles sp ON p.staff_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.month = '10' AND p.year = 2026
    `);
    console.log(`✅ Found ${res.rows.length} payroll records for October 2026:`);
    console.log('Sample record:', {
      id: res.rows[0].id,
      staff_name: res.rows[0].staff_name,
      base_salary: res.rows[0].base_salary,
      allowances: res.rows[0].allowances,
      deductions: res.rows[0].deductions,
      net_salary: res.rows[0].net_salary,
      status: res.rows[0].status,
      payment_reference: res.rows[0].payment_reference
    });

    // 2. Test mark paid with UTR
    const firstId = res.rows[0].id;
    const testUtr = 'SAL-UTR-998877';
    const updateRes = await pool.query(`
      UPDATE payrolls 
      SET status = 'paid', payment_date = CURRENT_DATE, payment_reference = $1
      WHERE id = $2 RETURNING *
    `, [`NEFT - ${testUtr}`, firstId]);
    console.log(`✅ Successfully updated payroll with UTR reference:`, updateRes.rows[0].payment_reference);

    // Reset status back to pending for testing
    await pool.query(`
      UPDATE payrolls 
      SET status = 'pending', payment_date = null, payment_reference = null
      WHERE id = $1
    `, [firstId]);
    console.log(`✅ Reset test record back to pending.`);
  } catch (e) {
    console.error('❌ Payroll live test failed:', e);
  } finally {
    await pool.end();
  }
}
testPayrollLive();

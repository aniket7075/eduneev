const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateHrAndPayrolls() {
  try {
    console.log('1. Adding payment_reference to payrolls table if not exists...');
    await pool.query(`
      ALTER TABLE payrolls 
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
    `);
    await pool.query(`
      ALTER TABLE payrolls 
      ADD COLUMN IF NOT EXISTS user_id UUID;
    `);

    console.log('2. Ensuring all staff users have staff_profiles...');
    const usersRes = await pool.query(`
      SELECT id, first_name, last_name, email, role, school_id 
      FROM users 
      WHERE role IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    `);

    for (const u of usersRes.rows) {
      const check = await pool.query('SELECT id FROM staff_profiles WHERE user_id = $1', [u.id]);
      if (check.rows.length === 0) {
        const salary = u.role === 'super_admin' ? 50000 : u.role === 'school_admin' ? 35000 : 25000;
        const desig = u.role === 'teacher' ? 'Preschool Teacher' : u.role === 'school_admin' ? 'Center Head' : 'Administrator';
        const empCode = `EMP-${u.first_name.slice(0,3).toUpperCase()}-${Math.floor(100 + Math.random()*900)}`;

        await pool.query(`
          INSERT INTO staff_profiles 
            (user_id, school_id, department, designation, employee_id, base_salary, joining_date)
          VALUES ($1, $2, 'Academics & Operations', $3, $4, $5, '2025-06-01')
        `, [u.id, u.school_id, desig, empCode, salary]);
        console.log(`  + Created staff_profile for ${u.first_name} ${u.last_name}`);
      }
    }

    console.log('3. Seed current month payroll records (October 2026)...');
    const profilesRes = await pool.query(`
      SELECT sp.id as staff_id, sp.school_id, sp.user_id, COALESCE(sp.base_salary, 25000) as base_salary,
             u.first_name, u.last_name
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.is_active = true
    `);

    for (const p of profilesRes.rows) {
      const basic = parseFloat(p.base_salary) || 25000;
      const allowances = 1500;
      const pfDeduction = Math.round(basic * 0.12);
      const leaveDeduction = 800;
      const totalDeductions = pfDeduction + leaveDeduction;
      const netSalary = basic + allowances - totalDeductions;

      await pool.query(`
        INSERT INTO payrolls (staff_id, user_id, school_id, month, year, basic_salary, allowances, deductions, net_salary, status)
        VALUES ($1, $2, $3, '10', 2026, $4, $5, $6, $7, 'pending')
        ON CONFLICT (staff_id, month, year) DO UPDATE SET
          basic_salary = EXCLUDED.basic_salary,
          allowances = EXCLUDED.allowances,
          deductions = EXCLUDED.deductions,
          net_salary = EXCLUDED.net_salary
      `, [p.staff_id, p.user_id, p.school_id, basic, allowances, totalDeductions, netSalary]);
    }
    console.log(`✅ Seeded October 2026 payroll for ${profilesRes.rows.length} staff profiles.`);
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await pool.end();
  }
}

migrateHrAndPayrolls();

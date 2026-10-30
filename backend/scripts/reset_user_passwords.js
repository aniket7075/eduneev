const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function resetPasswords() {
  try {
    console.log('🔑 Resetting user passwords and activating all accounts in Postgres DB...');

    const adminHash = await bcrypt.hash('Admin@123', 10);
    const standardHash = await bcrypt.hash('Password@123', 10);

    // 1. Reset Admin password
    await pool.query(
      `UPDATE users SET password_hash = $1, is_active = true WHERE role IN ('super_admin', 'school_admin')`,
      [adminHash]
    );
    console.log('✅ Admin passwords set to: Admin@123');

    // 2. Reset Teacher & Parent passwords
    await pool.query(
      `UPDATE users SET password_hash = $1, is_active = true WHERE role IN ('teacher', 'parent', 'non_teaching_staff')`,
      [standardHash]
    );
    console.log('✅ Teacher & Parent passwords set to: Password@123');

    // 3. Print all active user credentials
    const usersRes = await pool.query(
      `SELECT email, role, first_name, last_name, is_active FROM users ORDER BY role ASC, email ASC`
    );

    console.log('\n📋 AVAILABLE LOGIN CREDENTIALS:');
    console.log('---------------------------------------------------------');
    for (const u of usersRes.rows) {
      const defaultPass = (u.role === 'super_admin' || u.role === 'school_admin') ? 'Admin@123' : 'Password@123';
      console.log(`Role: ${u.role.toUpperCase().padEnd(12)} | Email: ${u.email.padEnd(30)} | Password: ${defaultPass}`);
    }
    console.log('---------------------------------------------------------\n');

  } catch (err) {
    console.error('❌ Reset password error:', err);
  } finally {
    await pool.end();
  }
}

resetPasswords();

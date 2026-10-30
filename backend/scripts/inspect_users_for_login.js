const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkUsers() {
  try {
    console.log('🔍 Inspecting users table in Postgres DB...');

    const res = await pool.query(`
      SELECT id, email, first_name, last_name, role, password_hash, is_active FROM users ORDER BY created_at ASC
    `);

    console.log(`Found ${res.rows.length} users in database:\n`);
    for (const u of res.rows) {
      console.log(`- Email: ${u.email} | Role: ${u.role} | Name: ${u.first_name} ${u.last_name} | Active: ${u.is_active}`);
      // Test password 'Admin@123' or 'Password@123' or 'admin123'
      const passAdmin123 = await bcrypt.compare('Admin@123', u.password_hash || '');
      const pass123 = await bcrypt.compare('Password@123', u.password_hash || '');
      const passAdmin = await bcrypt.compare('admin123', u.password_hash || '');
      console.log(`  Password Match -> 'Admin@123': ${passAdmin123} | 'Password@123': ${pass123} | 'admin123': ${passAdmin}`);
    }
  } catch (err) {
    console.error('Check users error:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();

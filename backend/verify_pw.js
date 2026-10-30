const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r = await pool.query(
    "SELECT email, password_hash FROM users WHERE role IN ('super_admin','school_admin') ORDER BY email"
  );
  
  const testPw = 'EduNeev@2024';
  for (const row of r.rows) {
    const ok = await bcrypt.compare(testPw, row.password_hash);
    console.log(`${row.email} | EduNeev@2024: ${ok ? '✅ VALID' : '❌ INVALID'}`);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

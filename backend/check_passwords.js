const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const testPasswords = ['admin123', 'Admin@123', 'password', '123456', 'eduneev123', 'Eduneev@123', 'Admin1234'];

async function main() {
  const result = await pool.query(
    `SELECT email, password_hash FROM users WHERE role IN ('super_admin','school_admin') ORDER BY role`
  );
  
  for (const user of result.rows) {
    const matches = [];
    for (const pw of testPasswords) {
      const ok = await bcrypt.compare(pw, user.password_hash);
      if (ok) matches.push(pw);
    }
    console.log(`${user.email} => ${matches.length > 0 ? 'PASSWORD: ' + matches.join(', ') : 'NO MATCH for common passwords'}`);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const NEW_PASSWORD = 'EduNeev@2024';

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  const users = [
    'admin@prescole.com',
    'chinchwad@eduneev.com',
    'chikhali@eduneev.com',
    'dudulgaon@eduneev.com',
  ];

  for (const email of users) {
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2 RETURNING email, role',
      [hash, email.toLowerCase()]
    );
    if (res.rows.length > 0) {
      console.log(`✅ Reset password for: ${res.rows[0].email} (${res.rows[0].role})`);
    } else {
      console.log(`⚠️  User not found: ${email}`);
    }
  }

  console.log(`\n🔑 New password for all above accounts: ${NEW_PASSWORD}`);
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });

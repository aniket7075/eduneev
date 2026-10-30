const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Generate a fresh bcrypt hash for Admin@123
    const freshHash = await bcrypt.hash('Admin@123', 10);
    console.log('Fresh hash for "Admin@123":', freshHash);

    // Get all users
    const res = await pool.query('SELECT id, email, role, password_hash, is_active FROM users');
    console.log('Current users in DB:', res.rows);

    // Let's test the hash in the DB against 'Admin@123'
    for (const user of res.rows) {
      try {
        const isValid = await bcrypt.compare('Admin@123', user.password_hash);
        console.log(`User ${user.email} - is "Admin@123" valid?`, isValid);
      } catch (err) {
        console.error(`Error comparing for user ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();

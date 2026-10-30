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
    const newHash = await bcrypt.hash('Admin@123', 10);
    console.log('New hash generated:', newHash);

    const res = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = 'admin@prescole.com'",
      [newHash]
    );
    console.log('Update result rows affected:', res.rowCount);

    // Verify it
    const checkRes = await pool.query("SELECT password_hash FROM users WHERE email = 'admin@prescole.com'");
    if (checkRes.rows.length > 0) {
      const isValid = await bcrypt.compare('Admin@123', checkRes.rows[0].password_hash);
      console.log('Verification: Is "Admin@123" valid now?', isValid);
    } else {
      console.log('Admin user not found!');
    }
  } catch (err) {
    console.error('Error updating:', err);
  } finally {
    await pool.end();
  }
}

main();

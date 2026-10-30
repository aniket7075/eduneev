const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding missing columns to notices table...');
    await pool.query('ALTER TABLE notices ADD COLUMN IF NOT EXISTS date VARCHAR(100)');
    await pool.query("ALTER TABLE notices ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'all'");
    console.log('Successfully updated notices table schema!');
  } catch (err) {
    console.error('Error updating notices table:', err);
  } finally {
    await pool.end();
  }
}

run();

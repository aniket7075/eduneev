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
    console.log('Renaming full_name to name in parents table...');
    await pool.query('ALTER TABLE parents RENAME COLUMN full_name TO name');
    console.log('Successfully renamed full_name to name!');
  } catch (err) {
    console.error('Error renaming column:', err);
  } finally {
    await pool.end();
  }
}

run();

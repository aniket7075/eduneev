import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  try {
    console.log('🔧 Adding missing columns to students and fee_structures tables...');
    await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS grade VARCHAR(50);`);
    await pool.query(`ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS grade VARCHAR(100);`);
    await pool.query(`ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS description TEXT;`);
    console.log('✅ Columns added (or already existed).');
  } catch (err) {
    console.error('❌ Error adding missing columns:', err);
  } finally {
    await pool.end();
  }
}

run();

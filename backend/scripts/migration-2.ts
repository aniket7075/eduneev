import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function runMigration() {
  try {
    console.log('Running migration 2...');
    
    const schemaUpdates = `
      -- Add alternative_mobile and address to parents table
      ALTER TABLE parents ADD COLUMN IF NOT EXISTS alternative_mobile VARCHAR(50);
      ALTER TABLE parents ADD COLUMN IF NOT EXISTS address TEXT;

      -- Add profile_image_url to students table
      ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
    `;

    await pool.query(schemaUpdates);
    console.log('Schema updates applied successfully.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();

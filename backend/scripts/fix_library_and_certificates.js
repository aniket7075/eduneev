const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  try {
    console.log('🔧 Creating and fixing library_books, book_issues, and certificates tables...');

    // 1. Create library_books table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(50),
        total_copies INT DEFAULT 1,
        available_copies INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ library_books table created successfully.');

    // 2. Create book_issues table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID REFERENCES library_books(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        issue_date TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP,
        return_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'issued',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ book_issues table created successfully.');

    // 3. Update certificates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        certificate_url TEXT,
        issue_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_id UUID;
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type VARCHAR(255);
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS reason TEXT;
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issue_date DATE;
    `);
    console.log('✅ certificates table updated successfully.');

  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

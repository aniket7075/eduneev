const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function fixExamsAndMarks() {
  try {
    console.log('🔧 Updating exams and exam_marks tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        term VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        grade VARCHAR(100),
        year VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE exams ADD COLUMN IF NOT EXISTS term VARCHAR(100);
      ALTER TABLE exams ADD COLUMN IF NOT EXISTS grade VARCHAR(100);
      ALTER TABLE exams ADD COLUMN IF NOT EXISTS year VARCHAR(50);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_marks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        subject VARCHAR(100) NOT NULL,
        marks_obtained NUMERIC DEFAULT 0,
        max_marks NUMERIC DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT exam_marks_exam_student_subject_key UNIQUE (exam_id, student_id, subject)
      );
    `);

    console.log('✅ exams & exam_marks tables created/updated successfully.');
  } catch (err) {
    console.error('❌ Exams tables error:', err);
  } finally {
    await pool.end();
  }
}

fixExamsAndMarks();

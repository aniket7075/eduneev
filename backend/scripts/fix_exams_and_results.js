const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function fixExamsAndResults() {
  try {
    console.log('🔧 Creating exams and exam_results tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        section_id UUID,
        name VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        total_marks INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        marks_obtained NUMERIC DEFAULT 0,
        grade VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT exam_results_exam_student_key UNIQUE (exam_id, student_id)
      );
    `);

    console.log('✅ exams & exam_results tables created successfully.');
  } catch (err) {
    console.error('❌ Exams tables error:', err);
  } finally {
    await pool.end();
  }
}

fixExamsAndResults();

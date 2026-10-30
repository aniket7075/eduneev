import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Running migration...');
    
    // Add enum value. This cannot be done inside a transaction block in older Postgres versions,
    // so we run it directly. If it fails because it already exists, we catch it.
    try {
      await pool.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'non_teaching_staff'");
      console.log('Added non_teaching_staff to user_role enum.');
    } catch (e: any) {
      if (e.code === '42710') {
        console.log('non_teaching_staff already exists in user_role enum.');
      } else {
        throw e;
      }
    }

    const schemaUpdates = `
      -- Create exams table
      CREATE TABLE IF NOT EXISTS exams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
          section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          exam_date DATE NOT NULL,
          total_marks INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create exam_results table
      CREATE TABLE IF NOT EXISTS exam_results (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
          student_id UUID REFERENCES students(id) ON DELETE CASCADE,
          marks_obtained DECIMAL(5, 2) NOT NULL,
          grade VARCHAR(10),
          remarks TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exam_id, student_id)
      );

      -- Create student_notes table
      CREATE TABLE IF NOT EXISTS student_notes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id UUID REFERENCES students(id) ON DELETE CASCADE,
          teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
          note_type VARCHAR(50) NOT NULL, -- 'behavior', 'academic', 'general'
          content TEXT NOT NULL,
          is_visible_to_parent BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(schemaUpdates);
    console.log('Schema updates (tables) applied successfully.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();

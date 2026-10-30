const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE timetables ADD COLUMN IF NOT EXISTS teacher_id UUID;
      
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID NOT NULL,
        grade VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        weekly_periods INTEGER DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(teacher_id, grade, subject)
      );
    `);
    console.log("Timetable migration successful");
  } catch (err) {
    console.error("Error migrating timetables", err);
  } finally {
    pool.end();
  }
};

migrate();

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Creating real-time health tables...');

    // 1. Ensure health_records columns exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        blood_group VARCHAR(20),
        allergies TEXT,
        height NUMERIC(5,2),
        weight NUMERIC(5,2),
        last_checkup_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Sick notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_sick_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        illness_type VARCHAR(150) NOT NULL,
        start_date DATE NOT NULL,
        rest_days VARCHAR(50) DEFAULT '1 to 2 Days',
        symptoms TEXT,
        requested_callback BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'School Notified',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Medical checkups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_medical_checkups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        checkup_date DATE NOT NULL DEFAULT CURRENT_DATE,
        doctor_name VARCHAR(255) NOT NULL,
        doctor_remarks TEXT,
        status VARCHAR(100) DEFAULT 'Fit & Healthy',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Sneha Jain's health record with her actual student details if empty
    const snehaRes = await pool.query(`SELECT id, school_id, blood_group FROM students WHERE first_name ILIKE '%Sneha%' LIMIT 1`);
    if (snehaRes.rows.length > 0) {
      const s = snehaRes.rows[0];
      const existing = await pool.query(`SELECT id FROM health_records WHERE student_id = $1`, [s.id]);
      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO health_records (student_id, school_id, blood_group, allergies, height, weight, last_checkup_date)
          VALUES ($1, $2, $3, 'None reported', 98, 15, CURRENT_DATE)
        `, [s.id, s.school_id, s.blood_group || 'B+']);
        console.log('Seeded real initial health record for Sneha Jain');
      }
    }

    console.log('✅ Real-time health tables created successfully');
  } catch (err) {
    console.error('Error setting up health tables:', err);
  } finally {
    await pool.end();
  }
}

main();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // 1. Add updated_at to inventory_items
    await pool.query('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    console.log('Added updated_at to inventory_items');

    // 2. Test daycare students query
    let query = `
      SELECT s.id, s.first_name, s.last_name, s.admission_number, s.grade, s.profile_image_url,
             COALESCE(p.name, s.emergency_contact_name, 'Parent') AS parent_name,
             COALESCE(p.contact_number, s.emergency_contact_phone, '') AS contact_number,
             s.emergency_contact_name, s.emergency_contact_phone,
             s.medical_notes, s.date_of_birth, s.gender, s.school_id
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE s.is_active = true
      ORDER BY s.first_name ASC
    `;
    const res = await pool.query(query);
    console.log('Daycare students query successful, row count:', res.rows.length);

    // 3. Check what happens if school_id filter is passed (e.g. integer vs UUID)
    const schools = await pool.query('SELECT id, name FROM schools');
    console.log('Schools:', schools.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

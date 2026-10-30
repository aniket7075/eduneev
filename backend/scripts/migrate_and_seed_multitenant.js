const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/Edunive/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting multi-tenant database migration...');
    await client.query('BEGIN');

    // 1. Add missing columns
    await client.query(`
      ALTER TABLE timetables ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
      ALTER TABLE teacher_subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
      ALTER TABLE homework ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
      ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    `);
    console.log('Added missing columns successfully.');

    // 2. Fetch schools
    const schoolsRes = await client.query('SELECT id, name FROM schools');
    console.log('Existing schools:', schoolsRes.rows);

    let chinchwadId = schoolsRes.rows.find(s => s.name.toLowerCase().includes('chinchwad'))?.id;
    let chikhaliId = schoolsRes.rows.find(s => s.name.toLowerCase().includes('chikhali'))?.id;
    let dudulgaonId = schoolsRes.rows.find(s => s.name.toLowerCase().includes('dudulgaon'))?.id;

    if (!chinchwadId || !chikhaliId || !dudulgaonId) {
      console.log('Creating missing branches...');
      if (!chinchwadId) {
        const res = await client.query(`
          INSERT INTO schools (name, address, city, state, contact_phone)
          VALUES ('Chinchwad Branch', 'RL-32, G Block, Sambhajinagar, Chinchwad', 'Chinchwad', 'Maharashtra', '9889883033')
          RETURNING id
        `);
        chinchwadId = res.rows[0].id;
      }
      if (!chikhaliId) {
        const res = await client.query(`
          INSERT INTO schools (name, address, city, state, contact_phone)
          VALUES ('Chikhali Branch', 'Pingale Chowk, Behind Imperial Hospital, Chikhali', 'Chikhali', 'Maharashtra', '9970841748')
          RETURNING id
        `);
        chikhaliId = res.rows[0].id;
      }
      if (!dudulgaonId) {
        const res = await client.query(`
          INSERT INTO schools (name, address, city, state, contact_phone)
          VALUES ('Dudulgaon Branch', 'Survey No 64, S.P College Road, Dudulgaon', 'Dudulgaon', 'Maharashtra', '9960893010')
          RETURNING id
        `);
        dudulgaonId = res.rows[0].id;
      }
    }

    console.log('Resolved School IDs:', { chinchwadId, chikhaliId, dudulgaonId });

    // 3. Map franchise admins and users in user_schools and users.school_id
    const userMappings = [
      { email: 'chinchwad@eduneev.com', schoolId: chinchwadId, role: 'school_admin' },
      { email: 'chikhali@eduneev.com', schoolId: chikhaliId, role: 'school_admin' },
      { email: 'dudulgaon@eduneev.com', schoolId: dudulgaonId, role: 'school_admin' },
      // Teachers assigned to branches
      { email: 'mangesh@gmail.com', schoolId: chinchwadId, role: 'teacher' },
      { email: 'dhanshree@gmail.com', schoolId: chinchwadId, role: 'teacher' },
      { email: 'snehajain200401@gmail.com', schoolId: chikhaliId, role: 'teacher' },
      { email: 'kavyajgreddy@gmail.com', schoolId: dudulgaonId, role: 'teacher' },
      { email: 'husukaleaniket@gmail.com', schoolId: chinchwadId, role: 'teacher' },
    ];

    for (const mapping of userMappings) {
      const userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [mapping.email.toLowerCase()]);
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        await client.query('UPDATE users SET school_id = $1, role = $2 WHERE id = $3', [mapping.schoolId, mapping.role, userId]);
        await client.query(`
          INSERT INTO user_schools (user_id, school_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, school_id) DO NOTHING
        `, [userId, mapping.schoolId]);
        await client.query('UPDATE staff_profiles SET school_id = $1 WHERE user_id = $2', [mapping.schoolId, userId]);
        console.log(`Mapped user ${mapping.email} to school ${mapping.schoolId}`);
      }
    }

    // 4. Update existing students without school_id to Chinchwad by default
    const studentUpdateRes = await client.query(
      'UPDATE students SET school_id = $1 WHERE school_id IS NULL',
      [chinchwadId]
    );
    console.log(`Updated ${studentUpdateRes.rowCount} orphan students to Chinchwad branch.`);

    // 5. Update existing timetables without school_id to Chinchwad
    await client.query(
      'UPDATE timetables SET school_id = $1 WHERE school_id IS NULL',
      [chinchwadId]
    );

    // 6. Update existing attendance without school_id by joining students
    await client.query(`
      UPDATE attendance a
      SET school_id = s.school_id
      FROM students s
      WHERE a.student_id = s.id AND a.school_id IS NULL AND s.school_id IS NOT NULL
    `);

    // 7. Franchise settings
    for (const sId of [chinchwadId, chikhaliId, dudulgaonId]) {
      await client.query(`
        INSERT INTO franchise_settings (school_id, royalty_percentage, is_franchise_branch)
        VALUES ($1, 10, true)
        ON CONFLICT (school_id) DO NOTHING
      `, [sId]);
    }

    await client.query('COMMIT');
    console.log('Multi-tenant migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  try {
    console.log('🔧 Fixing DB schemas for all 11 modules...');

    // 1. classes: add class_teacher_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        class_teacher_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_teacher_id UUID;
    `);
    console.log('✅ classes table ready.');

    // 2. timetables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grade VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(50) NOT NULL,
        period_number INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ timetables table ready.');

    // 3. certificates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID,
        type VARCHAR(255) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        certificate_url TEXT,
        issue_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ certificates table ready.');

    // 4. daycare_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daycare_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        student_id UUID,
        staff_id UUID,
        date DATE NOT NULL,
        activity_type VARCHAR(100),
        time VARCHAR(50),
        notes TEXT,
        check_in_time VARCHAR(50),
        check_out_time VARCHAR(50),
        meals VARCHAR(255),
        nap_start VARCHAR(50),
        nap_end VARCHAR(50),
        mood VARCHAR(50),
        water_intake VARCHAR(50),
        washroom_visits INT DEFAULT 0,
        learning_activity TEXT,
        teacher_notes TEXT,
        parent_visible BOOLEAN DEFAULT TRUE,
        logged_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT daycare_logs_student_id_date_key UNIQUE (student_id, date)
      );
    `);
    console.log('✅ daycare_logs table ready.');

    // 5. franchises
    await pool.query(`
      CREATE TABLE IF NOT EXISTS franchises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE,
        owner_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        city VARCHAR(100),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ franchises table created.');

    // 6. expenses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        vendor_id UUID,
        recorded_by UUID,
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ expenses table ready.');

    // 7. leaves
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(100) DEFAULT 'Casual Leave',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ leaves table created.');

    // 8. notices
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_audience VARCHAR(100) DEFAULT 'all',
        audience VARCHAR(100) DEFAULT 'all',
        category VARCHAR(100) DEFAULT 'general',
        attachment_url TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ notices table ready.');

    // 9. galleries & gallery_photos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS galleries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gallery_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        album_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ galleries & gallery_photos tables ready.');

  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  try {
    console.log('🔧 Updating DB tables for HR, Payrolls, and Enquiries...');
    
    // 1. Fix enquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        child_name VARCHAR(255),
        parent_name VARCHAR(255),
        parent_phone VARCHAR(50),
        parent_email VARCHAR(255),
        child_age INT,
        child_dob DATE,
        class_interested VARCHAR(100),
        lead_source VARCHAR(100) DEFAULT 'walk-in',
        remarks TEXT,
        assigned_to UUID,
        status VARCHAR(50) DEFAULT 'new',
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS child_name VARCHAR(255);
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255);
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS child_age INT;
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS child_dob DATE;
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS class_interested VARCHAR(100);
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) DEFAULT 'walk-in';
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS remarks TEXT;
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_to UUID;
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
      ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS follow_up_date DATE;
    `);
    console.log('✅ Enquiries table columns updated.');

    // 2. Fix enquiry_follow_ups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiry_follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
        notes TEXT,
        status VARCHAR(50),
        next_follow_up_date DATE,
        done_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Enquiry follow-ups table created.');

    // 3. Fix staff_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        school_id UUID,
        employee_id VARCHAR(50),
        department VARCHAR(100),
        designation VARCHAR(100),
        joining_date DATE,
        base_salary NUMERIC DEFAULT 0,
        bank_account_number VARCHAR(50),
        bank_name VARCHAR(100),
        ifsc_code VARCHAR(20),
        pan_number VARCHAR(20),
        address TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS joining_date DATE;
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0;
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
      ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'staff_profiles_user_id_key'
        ) THEN
          ALTER TABLE staff_profiles ADD CONSTRAINT staff_profiles_user_id_key UNIQUE (user_id);
        END IF;
      END $$;
    `);
    console.log('✅ Staff Profiles table columns updated.');

    // 4. Fix payrolls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payrolls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
        school_id UUID,
        month INT NOT NULL,
        year INT NOT NULL,
        basic_salary NUMERIC DEFAULT 0,
        allowances NUMERIC DEFAULT 0,
        deductions NUMERIC DEFAULT 0,
        net_salary NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'unpaid',
        payment_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS month INT;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS year INT;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS allowances NUMERIC DEFAULT 0;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS deductions NUMERIC DEFAULT 0;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS net_salary NUMERIC DEFAULT 0;
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unpaid';
      ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS payment_date DATE;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payrolls_staff_id_month_year_key'
        ) THEN
          ALTER TABLE payrolls ADD CONSTRAINT payrolls_staff_id_month_year_key UNIQUE (staff_id, month, year);
        END IF;
      END $$;
    `);
    console.log('✅ Payrolls table columns updated.');

  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

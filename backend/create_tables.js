const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        parent_name VARCHAR(255) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        program_interested VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        follow_up_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS staff_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        school_id UUID,
        department VARCHAR(100),
        designation VARCHAR(100),
        join_date DATE,
        salary DECIMAL(10,2),
        bank_details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payrolls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID REFERENCES staff_profiles(id),
        school_id UUID,
        month VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        basic_salary DECIMAL(10,2),
        allowances DECIMAL(10,2) DEFAULT 0,
        deductions DECIMAL(10,2) DEFAULT 0,
        net_salary DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'Pending',
        payment_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daycare_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        student_id UUID,
        staff_id UUID,
        date DATE NOT NULL,
        activity_type VARCHAR(100) NOT NULL,
        time TIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daycare_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        student_id UUID,
        start_time TIME,
        end_time TIME,
        days_of_week JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        date DATE NOT NULL,
        description TEXT,
        vendor_id UUID,
        recorded_by UUID,
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        unit VARCHAR(50),
        min_threshold INTEGER DEFAULT 5,
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES inventory_items(id),
        school_id UUID,
        type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        reference VARCHAR(100),
        performed_by UUID,
        date TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS franchise_branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        location TEXT,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        established_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cctv_cameras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        stream_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Online',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        school_id UUID,
        blood_group VARCHAR(10),
        allergies TEXT,
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        last_checkup_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daily_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        school_id UUID,
        date DATE NOT NULL,
        nap_start TIME,
        nap_end TIME,
        meals_eaten TEXT,
        mood VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        type VARCHAR(50) DEFAULT 'event',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        fee_id UUID,
        school_id UUID,
        amount DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50),
        date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ptm_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        teacher_id UUID NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration INTEGER DEFAULT 15,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ptm_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ptm_id UUID REFERENCES ptm_schedules(id) ON DELETE CASCADE,
        student_id UUID NOT NULL,
        school_id UUID,
        time_slot TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Booked',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS food_menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        date DATE NOT NULL,
        breakfast TEXT,
        lunch TEXT,
        snacks TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Tables created successfully");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    pool.end();
  }
};

createTables();

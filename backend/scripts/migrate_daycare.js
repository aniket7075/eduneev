const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  try {
    console.log('Migrating daycare_logs table in Postgres...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daycare_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        date DATE NOT NULL,
        check_in_time VARCHAR(20),
        check_out_time VARCHAR(20),
        meals JSONB DEFAULT '{}',
        nap_start VARCHAR(20),
        nap_end VARCHAR(20),
        mood VARCHAR(50),
        water_intake VARCHAR(50),
        washroom_visits INT DEFAULT 0,
        learning_activity TEXT,
        teacher_notes TEXT,
        parent_visible BOOLEAN DEFAULT true,
        logged_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(20);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(20);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS meals JSONB DEFAULT '{}';
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS nap_start VARCHAR(20);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS nap_end VARCHAR(20);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS mood VARCHAR(50);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS water_intake VARCHAR(50);
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS washroom_visits INT DEFAULT 0;
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS learning_activity TEXT;
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS parent_visible BOOLEAN DEFAULT true;
      ALTER TABLE daycare_logs ADD COLUMN IF NOT EXISTS logged_by UUID;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'daycare_logs_student_id_date_key'
        ) THEN
          ALTER TABLE daycare_logs ADD CONSTRAINT daycare_logs_student_id_date_key UNIQUE (student_id, date);
        END IF;
      END $$;
    `);
    console.log('✅ Daycare Logs table successfully created and updated with all proper columns!');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

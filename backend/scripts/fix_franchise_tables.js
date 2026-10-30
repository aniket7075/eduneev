const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function fixFranchise() {
  try {
    console.log('🔧 Creating franchise tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS franchise_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
        royalty_percentage NUMERIC DEFAULT 10,
        is_franchise_branch BOOLEAN DEFAULT false,
        head_office_school_id UUID,
        brand_name VARCHAR(255),
        franchise_start_date DATE,
        contract_end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS royalty_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        period_month INT NOT NULL,
        period_year INT NOT NULL,
        total_revenue NUMERIC DEFAULT 0,
        royalty_percentage NUMERIC DEFAULT 10,
        royalty_amount NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        payment_date DATE,
        payment_reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT royalty_records_school_month_year_key UNIQUE (school_id, period_month, period_year)
      );
    `);

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

    console.log('✅ Franchise tables created/verified successfully.');
  } catch (err) {
    console.error('❌ Franchise tables error:', err);
  } finally {
    await pool.end();
  }
}

fixFranchise();

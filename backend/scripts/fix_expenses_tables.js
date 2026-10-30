const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function fixExpenses() {
  try {
    console.log('🔧 Creating expense_categories and updating expenses table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) DEFAULT '#6366F1',
        icon VARCHAR(50) DEFAULT 'receipt',
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id UUID;
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    console.log('✅ Expense categories & Expenses columns updated successfully.');
  } catch (err) {
    console.error('❌ Expenses tables error:', err);
  } finally {
    await pool.end();
  }
}

fixExpenses();

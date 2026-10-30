const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspectMore() {
  try {
    const targetTables = [
      'student_fees', 'payrolls', 'royalty_records', 'supply_requests', 
      'staff_profiles', 'franchises', 'franchise_settings', 'inventory_orders'
    ];

    for (const t of targetTables) {
      const colRes = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [t]);
      console.log(`\n=== TABLE: ${t} ===`);
      colRes.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspectMore();

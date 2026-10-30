const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspectTables() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('--- ALL TABLES IN DB ---');
    console.log(tables.join(', '));

    const targetTables = [
      'enquiries', 'fees', 'fee_structures', 'payments', 'expenses', 
      'franchise_branches', 'franchise_demands', 'franchise_dispatches', 'franchise_revenue',
      'royalty_payments', 'franchise_orders', 'staff', 'staff_salaries', 'payroll',
      'attendance', 'staff_attendance'
    ];

    for (const t of targetTables) {
      if (tables.includes(t)) {
        const colRes = await pool.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [t]);
        console.log(`\n=== TABLE: ${t} ===`);
        colRes.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
      } else {
        console.log(`\n❌ TABLE NOT FOUND IN DB: ${t}`);
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await pool.end();
  }
}

inspectTables();

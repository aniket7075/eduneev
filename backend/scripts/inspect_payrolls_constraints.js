const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPayrollsTable() {
  try {
    const colRes = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payrolls'
    `);
    console.log('--- PAYROLLS COLUMNS ---');
    colRes.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (null: ${c.is_nullable})`));

    const constrRes = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'payrolls'
    `);
    console.log('\n--- PAYROLLS CONSTRAINTS ---');
    constrRes.rows.forEach(c => console.log(`  ${c.conname} (${c.contype}): ${c.pg_get_constraintdef}`));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkPayrollsTable();

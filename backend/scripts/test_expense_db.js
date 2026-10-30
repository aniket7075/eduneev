const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testExpense() {
  try {
    const schoolRes = await pool.query('SELECT id FROM schools LIMIT 1');
    const schoolId = schoolRes.rows[0]?.id;
    console.log('Using schoolId:', schoolId);

    // Test insert of Stationery expense
    const ins = await pool.query(`
      INSERT INTO expenses (school_id, title, amount, category, date, expense_date, description, payment_method, notes)
      VALUES ($1, 'Color Pencils & Drawing Books', 1450, 'Stationery', CURRENT_DATE, CURRENT_DATE, 'Classroom art stationery', 'Cash', 'Approved by Center Head')
      RETURNING *
    `, [schoolId]);
    console.log('✅ Inserted expense:', ins.rows[0]);

    // Test query
    const q = await pool.query(`
      SELECT * FROM expenses WHERE category = 'Stationery'
    `);
    console.log('✅ Found Stationery expenses in DB:', q.rows.length);

    // Cleanup test record
    await pool.query(`DELETE FROM expenses WHERE id = $1`, [ins.rows[0].id]);
    console.log('✅ Cleaned test expense');
  } catch (e) {
    console.error('❌ Expense test error:', e);
  } finally {
    await pool.end();
  }
}

testExpense();

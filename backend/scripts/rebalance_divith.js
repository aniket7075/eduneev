const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  try {
    await pool.query(`
      UPDATE payments 
      SET student_fee_id = '5c75b961-59bb-444f-aaa8-496cb78fb772'
      WHERE id = '171fc929-5f35-48d1-8df3-77af7eb2325e';
    `);
    await pool.query(`
      UPDATE student_fees
      SET status = 'paid'
      WHERE id = '5c75b961-59bb-444f-aaa8-496cb78fb772';
    `);
    console.log('Rebalanced payments for Divith successfully!');

    const res = await pool.query(`
      SELECT sf.id, fs.fee_type, sf.amount_due, sf.status, COALESCE(SUM(p.amount_paid), 0) as paid
      FROM student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      LEFT JOIN payments p ON p.student_fee_id = sf.id
      WHERE sf.student_id = 'c0007c4b-2fc8-4011-a11e-608995154a8b'
      GROUP BY sf.id, fs.fee_type, sf.amount_due, sf.status;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fix();

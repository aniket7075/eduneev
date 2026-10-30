const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const studentsRes = await pool.query(`
      SELECT COUNT(*) as total_students FROM students WHERE is_active = true;
    `);
    console.log('Active students:', studentsRes.rows[0]);

    const sfRes = await pool.query(`
      SELECT COUNT(*) as total_fees, SUM(amount_due) as total_due FROM student_fees;
    `);
    console.log('Student fees count & sum:', sfRes.rows[0]);

    const paymentsRes = await pool.query(`
      SELECT COUNT(*) as total_payments, SUM(amount_paid) as total_paid FROM payments;
    `);
    console.log('Payments count & sum:', paymentsRes.rows[0]);

    const sample = await pool.query(`
      SELECT 
        s.first_name, s.last_name, s.grade, 
        sch.name as school_name,
        sf.amount_due, sf.status as fee_status,
        fs.fee_type,
        p.amount_paid, p.payment_method
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN student_fees sf ON s.id = sf.student_id
      LEFT JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      LEFT JOIN payments p ON sf.id = p.student_fee_id
      LIMIT 15;
    `);
    console.log('Sample fees records:');
    console.table(sample.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const parentEmail = 'kavyamaheshnandi@gmail.com';
    const stRes = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.grade 
       FROM students s
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE LOWER(p.email) = $1`,
      [parentEmail]
    );
    console.log('Student found for Kavya:', stRes.rows[0]);

    const studentId = stRes.rows[0].id;

    const feesRes = await pool.query(
      `SELECT sf.id, sf.amount_due, sf.status, sf.due_date, fs.fee_type
       FROM student_fees sf
       JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       WHERE sf.student_id = $1
       ORDER BY sf.due_date ASC`,
      [studentId]
    );
    console.log('Fees:', feesRes.rows);

    const paymentsRes = await pool.query(
      `SELECT p.id, p.amount_paid, p.payment_method, p.razorpay_order_id as receipt_no,
              p.razorpay_payment_id as transaction_ref, p.created_at, fs.fee_type
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       WHERE sf.student_id = $1
       ORDER BY p.created_at ASC`,
      [studentId]
    );
    console.log('Payments count:', paymentsRes.rows.length);
    console.table(paymentsRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

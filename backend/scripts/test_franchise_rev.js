const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testRevenueHistory() {
  try {
    const targetYear = 2026;
    const query = `
      SELECT 
        s.id AS school_id,
        s.name AS school_name,
        s.city,
        m.month_num AS period_month,
        TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Month') AS month_name,
        $1::integer AS period_year,
        COALESCE(rev.total_revenue, 0) AS total_revenue,
        COALESCE(fs.royalty_percentage, 10) AS royalty_percentage,
        ROUND((COALESCE(rev.total_revenue, 0) * COALESCE(fs.royalty_percentage, 10)) / 100) AS royalty_amount,
        COALESCE(rr.status, CASE WHEN COALESCE(rev.total_revenue, 0) > 0 THEN 'PENDING' ELSE 'NIL' END) AS status,
        COALESCE(rr.payment_method, 'Online / NEFT') AS payment_method,
        COALESCE(rr.payment_reference, '-') AS payment_reference,
        rr.proof_url
      FROM schools s
      CROSS JOIN (SELECT generate_series(1, 12) AS month_num) m
      LEFT JOIN franchise_settings fs ON fs.school_id = s.id
      LEFT JOIN (
        SELECT 
          COALESCE(st.school_id, (SELECT id FROM schools WHERE name LIKE '%Chinchwad%' LIMIT 1)) AS school_id,
          EXTRACT(MONTH FROM COALESCE(p.payment_date, p.created_at))::integer AS p_month,
          SUM(p.amount_paid) AS total_revenue
        FROM payments p
        JOIN student_fees sf ON p.student_fee_id = sf.id
        JOIN students st ON sf.student_id = st.id
        WHERE EXTRACT(YEAR FROM COALESCE(p.payment_date, p.created_at)) = $1
        GROUP BY 1, 2
      ) rev ON rev.school_id = s.id AND rev.p_month = m.month_num
      LEFT JOIN royalty_records rr ON rr.school_id = s.id AND rr.period_month = m.month_num AND rr.period_year = $1
      WHERE ($2::uuid IS NULL OR s.id = $2)
      ORDER BY s.name ASC, m.month_num DESC
    `;
    const res = await pool.query(query, [targetYear, null]);
    console.log(`✅ Revenue history query succeeded! Returned ${res.rows.length} rows.`);
    console.log('Sample row:', res.rows[0]);
  } catch (e) {
    console.error('❌ Revenue history test error:', e);
  } finally {
    await pool.end();
  }
}

testRevenueHistory();

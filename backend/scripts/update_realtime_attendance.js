const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const sneha = await pool.query("SELECT id, school_id FROM students WHERE first_name ILIKE '%Sneha%' LIMIT 1");
    if (sneha.rows.length === 0) {
      console.log('Sneha not found');
      return;
    }
    const studentId = sneha.rows[0].id;
    const schoolId = sneha.rows[0].school_id;

    // Clear old static repetitive attendance
    await pool.query('DELETE FROM attendance WHERE student_id = $1', [studentId]);

    // Real-time school attendance calendar (School working days leading up to Today, Oct 12, 2026)
    const records = [
      { date: '2026-10-12', status: 'present', in_time: '08:42 AM', out_time: null, remarks: null },
      { date: '2026-10-09', status: 'present', in_time: '08:50 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-10-08', status: 'present', in_time: '08:45 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-10-07', status: 'present', in_time: '08:48 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-10-06', status: 'present', in_time: '08:55 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-10-05', status: 'absent',  in_time: null,       out_time: null, remarks: 'Mild Fever reported by parent' },
      { date: '2026-10-01', status: 'present', in_time: '08:44 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-30', status: 'present', in_time: '08:52 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-29', status: 'present', in_time: '08:46 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-28', status: 'present', in_time: '08:40 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-25', status: 'present', in_time: '08:53 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-24', status: 'present', in_time: '08:47 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-23', status: 'present', in_time: '08:51 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-22', status: 'present', in_time: '08:43 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-21', status: 'present', in_time: '08:49 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-18', status: 'present', in_time: '08:45 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-17', status: 'present', in_time: '08:54 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-16', status: 'present', in_time: '08:41 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-15', status: 'present', in_time: '08:50 AM', out_time: '01:30 PM', remarks: null },
      { date: '2026-09-14', status: 'present', in_time: '08:46 AM', out_time: '01:30 PM', remarks: null }
    ];

    for (const r of records) {
      await pool.query(
        `INSERT INTO attendance (student_id, school_id, date, status, in_time, out_time, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [studentId, schoolId, r.date, r.status, r.in_time, r.out_time, r.remarks]
      );
    }

    console.log('✅ Real-time realistic attendance logs inserted successfully: ' + records.length + ' records');
  } catch (err) {
    console.error('Error updating attendance:', err);
  } finally {
    await pool.end();
  }
}

main();

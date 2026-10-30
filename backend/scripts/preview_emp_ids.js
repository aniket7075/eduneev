const { pool } = require('../dist/config/database');

const getBranchCode = (name, email) => {
  const str = ((name || '') + ' ' + (email || '')).toLowerCase();
  if (str.includes('chikhali')) return 'CHK';
  if (str.includes('dudulgaon')) return 'DUD';
  return 'CHW';
};

async function run() {
  const res = await pool.query(`
    SELECT u.id, u.first_name, u.last_name, u.email, COALESCE(s.name, 'Chinchwad Branch') as school_name, sp.employee_id
    FROM users u
    LEFT JOIN staff_profiles sp ON sp.user_id = u.id
    LEFT JOIN schools s ON s.id = u.school_id
    WHERE u.role IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    ORDER BY u.created_at ASC
  `);

  const counters = {};
  for (const row of res.rows) {
    const code = getBranchCode(row.school_name, row.email);
    counters[code] = (counters[code] || 0) + 1;
    const newId = `EMP-${code}-${String(counters[code]).padStart(3, '0')}`;
    console.log(`${row.first_name} ${row.last_name} (${code}) | Old: ${row.employee_id} | Proposed: ${newId}`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

const { pool } = require('../dist/config/database');

const getBranchCode = (name, email) => {
  const str = ((name || '') + ' ' + (email || '')).toLowerCase();
  if (str.includes('chikhali')) return 'CHK';
  if (str.includes('dudulgaon')) return 'DUD';
  return 'CHW';
};

async function run() {
  const res = await pool.query(`
    SELECT u.id, u.first_name, u.last_name, u.email, 
           COALESCE(u.school_id, sp.school_id) as school_id,
           COALESCE(s.name, 
                    CASE 
                      WHEN LOWER(u.email) LIKE '%chikhali%' THEN 'Chikhali Branch'
                      WHEN LOWER(u.email) LIKE '%dudulgaon%' THEN 'Dudulgaon Branch'
                      ELSE 'Chinchwad Branch'
                    END
           ) as school_name,
           sp.employee_id
    FROM users u
    LEFT JOIN staff_profiles sp ON sp.user_id = u.id
    LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sp.school_id)
    WHERE u.role IN ('teacher', 'school_admin', 'super_admin', 'non_teaching_staff')
    ORDER BY u.created_at ASC
  `);

  const counters = {};
  for (const row of res.rows) {
    const code = getBranchCode(row.school_name, row.email);
    counters[code] = (counters[code] || 0) + 1;
    const newId = `EMP-${code}-${String(counters[code]).padStart(3, '0')}`;
    
    await pool.query(`
      INSERT INTO staff_profiles (user_id, school_id, employee_id, department, designation)
      VALUES ($1, $2, $3, 'Teaching', 'Staff Member')
      ON CONFLICT (user_id) DO UPDATE SET 
        employee_id = EXCLUDED.employee_id, 
        school_id = COALESCE(staff_profiles.school_id, EXCLUDED.school_id),
        updated_at = NOW()
    `, [row.id, row.school_id, newId]);

    console.log(`✅ Standardized: ${row.first_name} ${row.last_name} (${code}) => ${newId}`);
  }

  console.log(`\n🎉 All ${res.rows.length} staff members successfully assigned branch-wise Employee IDs!`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

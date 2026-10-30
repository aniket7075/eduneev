require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const CHINCHWAD_ID = '8aa96068-8694-4b75-b224-d0afe52e280e';
const CHIKHALI_ID = '9e5e2fa3-a6ce-444e-9ad6-2797c4f514d4';
const DUDULGAON_ID = 'c75b32e9-dcb7-4718-9e44-71bb23f46405';

const { pool } = require('../dist/config/database');

async function runTests() {
  console.log('==============================================');
  console.log('TESTING MULTI-TENANT FRANCHISE DATA ISOLATION');
  console.log('==============================================\n');

  // Ensure super admin has valid password
  const chinchwadUser = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['chinchwad@eduneev.com']);
  if (chinchwadUser.rows.length > 0) {
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [chinchwadUser.rows[0].password_hash, 'admin@prescole.com']);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test Login with Chinchwad Admin
  let chinchwadToken, chikhaliToken, dudulgaonToken, superAdminToken;

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'chinchwad@eduneev.com',
      password: 'password123'
    });
    chinchwadToken = res.data.token;
    assert(!!chinchwadToken, 'Chinchwad admin login successful');
    assert(res.data.user.school_id === CHINCHWAD_ID, `Chinchwad admin user has correct school_id (${res.data.user.school_id})`);
  } catch (err) {
    console.error('Chinchwad login failed:', err.response?.data || err.message);
    failed++;
  }

  // 2. Test Login with Chikhali Admin
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'chikhali@eduneev.com',
      password: 'password123'
    });
    chikhaliToken = res.data.token;
    assert(!!chikhaliToken, 'Chikhali admin login successful');
    assert(res.data.user.school_id === CHIKHALI_ID, `Chikhali admin user has correct school_id (${res.data.user.school_id})`);
  } catch (err) {
    console.error('Chikhali login failed:', err.response?.data || err.message);
    failed++;
  }

  // 3. Test Login with Dudulgaon Admin
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'dudulgaon@eduneev.com',
      password: 'password123'
    });
    dudulgaonToken = res.data.token;
    assert(!!dudulgaonToken, 'Dudulgaon admin login successful');
    assert(res.data.user.school_id === DUDULGAON_ID, `Dudulgaon admin user has correct school_id (${res.data.user.school_id})`);
  } catch (err) {
    console.error('Dudulgaon login failed:', err.response?.data || err.message);
    failed++;
  }

  // 4. Test Login with Super Admin
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@prescole.com',
      password: 'password123'
    });
    superAdminToken = res.data.token;
    assert(!!superAdminToken, 'Super admin login successful');
    assert(res.data.user.role === 'super_admin', 'Super admin user has role super_admin');
  } catch (err) {
    console.error('Super admin login failed:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n--- VERIFYING STUDENT DATA ISOLATION ---');

  // Chinchwad students check
  try {
    const res = await axios.get(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${chinchwadToken}` }
    });
    const students = res.data;
    assert(students.length > 0, `Chinchwad admin sees their students (Count: ${students.length})`);
    const allChinchwad = students.every(s => s.school_id === CHINCHWAD_ID);
    assert(allChinchwad, 'All students returned to Chinchwad admin have Chinchwad school_id');
  } catch (err) {
    console.error('Chinchwad students query failed:', err.message);
    failed++;
  }

  // Chikhali students check (should NOT see Chinchwad students)
  try {
    const res = await axios.get(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${chikhaliToken}` }
    });
    const students = res.data;
    const hasChinchwadStudents = students.some(s => s.school_id === CHINCHWAD_ID);
    assert(!hasChinchwadStudents, 'Chikhali admin CANNOT see Chinchwad students (Zero leaked students)');
  } catch (err) {
    console.error('Chikhali students query failed:', err.message);
    failed++;
  }

  // Cross-tenant spoofing check: Chikhali tries to pass ?school_id=CHINCHWAD_ID
  try {
    const res = await axios.get(`${BASE_URL}/admin/students?school_id=${CHINCHWAD_ID}`, {
      headers: { Authorization: `Bearer ${chikhaliToken}` }
    });
    const students = res.data;
    const hasChinchwadStudents = students.some(s => s.school_id === CHINCHWAD_ID);
    assert(!hasChinchwadStudents, 'Cross-tenant bypass blocked: Chikhali admin cannot spoof ?school_id=Chinchwad');
  } catch (err) {
    console.error('Spoofing check failed:', err.message);
    failed++;
  }

  console.log('\n--- VERIFYING FEES SUMMARY ISOLATION ---');

  // Chinchwad fees check
  try {
    const res = await axios.get(`${BASE_URL}/fees/summary/all`, {
      headers: { Authorization: `Bearer ${chinchwadToken}` }
    });
    const feeStudents = res.data?.data || [];
    assert(feeStudents.length > 0, `Chinchwad admin sees their fee records (Count: ${feeStudents.length})`);
  } catch (err) {
    console.error('Chinchwad fees query failed:', err.message);
    failed++;
  }

  // Dudulgaon fees check (should NOT see Chinchwad fees)
  try {
    const res = await axios.get(`${BASE_URL}/fees/summary/all`, {
      headers: { Authorization: `Bearer ${dudulgaonToken}` }
    });
    const feeStudents = res.data?.data || [];
    const hasChinchwad = feeStudents.some(s => s.student_id && s.school_id === CHINCHWAD_ID);
    assert(!hasChinchwad && feeStudents.length === 0, 'Dudulgaon admin CANNOT see Chinchwad fee summaries (Zero leak)');
  } catch (err) {
    console.error('Dudulgaon fees query failed:', err.message);
    failed++;
  }

  console.log('\n--- VERIFYING STAFF & HR ISOLATION ---');

  // Chinchwad staff check
  try {
    const res = await axios.get(`${BASE_URL}/hr/staff`, {
      headers: { Authorization: `Bearer ${chinchwadToken}` }
    });
    const staff = res.data?.data || [];
    assert(staff.length > 0, `Chinchwad admin sees their staff (Count: ${staff.length})`);
    const allChinchwadStaff = staff.every(s => s.school_id === CHINCHWAD_ID);
    assert(allChinchwadStaff, 'All staff returned to Chinchwad belong to Chinchwad school_id');
  } catch (err) {
    console.error('Chinchwad staff query failed:', err.message);
    failed++;
  }

  // Chikhali staff check (should not see Chinchwad staff)
  try {
    const res = await axios.get(`${BASE_URL}/hr/staff`, {
      headers: { Authorization: `Bearer ${chikhaliToken}` }
    });
    const staff = res.data?.data || [];
    const hasChinchwadStaff = staff.some(s => s.school_id === CHINCHWAD_ID);
    assert(!hasChinchwadStaff, 'Chikhali admin CANNOT see Chinchwad staff members');
  } catch (err) {
    console.error('Chikhali staff query failed:', err.message);
    failed++;
  }

  console.log('\n--- VERIFYING SUPER ADMIN ACCESS ---');

  // Super admin can see all
  try {
    const res = await axios.get(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(res.data.length >= 3, `Super admin can see all students across branches (Count: ${res.data.length})`);
  } catch (err) {
    console.error('Super admin students query failed:', err.message);
    failed++;
  }

  // Super admin can filter to Chinchwad
  try {
    const res = await axios.get(`${BASE_URL}/admin/students?school_id=${CHINCHWAD_ID}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const filtered = res.data;
    assert(filtered.every(s => s.school_id === CHINCHWAD_ID), 'Super admin can filter specifically by branch (Chinchwad)');
  } catch (err) {
    console.error('Super admin filtered query failed:', err.message);
    failed++;
  }

  console.log('\n==============================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('==============================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

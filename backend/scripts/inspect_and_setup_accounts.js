const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../dist/config/database');
const bcrypt = require('bcrypt');

async function main() {
  try {
    const saltRounds = 10;
    const commonPassword = 'Password@123';
    const newHash = await bcrypt.hash(commonPassword, saltRounds);

    // 1. Super Admin: admin@prescole.com
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@prescole.com'", [newHash]);

    // 2. Franchise Admins
    await pool.query("UPDATE users SET password_hash = $1 WHERE email IN ('chinchwad@eduneev.com', 'chikhali@eduneev.com', 'dudulgaon@eduneev.com')", [newHash]);

    // 3. Teachers
    await pool.query("UPDATE users SET password_hash = $1 WHERE role = 'teacher'", [newHash]);

    // Create a clean easy-to-remember teacher if not exists: teacher.chinchwad@eduneev.com
    const chinchwadSchool = (await pool.query("SELECT id FROM schools WHERE name ILIKE '%Chinchwad%'")).rows[0];
    const teacherCheck = await pool.query("SELECT id FROM users WHERE email = 'teacher.chinchwad@eduneev.com'");
    if (teacherCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, school_id)
         VALUES ('teacher.chinchwad@eduneev.com', $1, 'teacher', 'Pooja', 'Sharma', $2)`,
        [newHash, chinchwadSchool.id]
      );
    } else {
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'teacher.chinchwad@eduneev.com'", [newHash]);
    }

    // 4. Parents
    await pool.query("UPDATE users SET password_hash = $1 WHERE role = 'parent'", [newHash]);

    // Create an easy-to-remember parent: parent.chinchwad@eduneev.com
    const parentCheck = await pool.query("SELECT id FROM users WHERE email = 'parent.chinchwad@eduneev.com'");
    if (parentCheck.rows.length === 0) {
      const parentUser = await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, school_id)
         VALUES ('parent.chinchwad@eduneev.com', $1, 'parent', 'Suresh', 'Verma', $2) RETURNING id`,
        [newHash, chinchwadSchool.id]
      );
      // Also add in parents table
      const pEntry = await pool.query(
        `INSERT INTO parents (name, email, contact_number, address)
         VALUES ('Suresh Verma (Parent)', 'parent.chinchwad@eduneev.com', '9889883033', 'Chinchwad, Pune') RETURNING id`
      );
      // Link to first student
      const firstStu = await pool.query("SELECT id FROM students WHERE school_id = $1 LIMIT 1", [chinchwadSchool.id]);
      if (firstStu.rows.length > 0) {
        await pool.query("UPDATE students SET parent_id = $1 WHERE id = $2", [pEntry.rows[0].id, firstStu.rows[0].id]);
      }
    } else {
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'parent.chinchwad@eduneev.com'", [newHash]);
    }

    console.log("==================================================");
    console.log("✅ ALL PASSWORDS SET TO: Password@123");
    console.log("==================================================");
    
    // Display all active users and their roles
    const all = await pool.query(`
      SELECT u.email, u.role, u.first_name, u.last_name, s.name as branch_name 
      FROM users u 
      LEFT JOIN schools s ON u.school_id = s.id 
      ORDER BY u.role, u.email
    `);
    console.table(all.rows);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    pool.end();
  }
}

main();
